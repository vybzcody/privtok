import { fieldsToString } from "../encoder.js";
import { filterVisibility } from "../processing.js";

export const parseImages = async (state) => {
    const updatedMetadata = { ...state.metadata };

    if (!state.posts) return state;

    for (const postId of Object.keys(state.posts)) {
        let metadata = state.posts[postId]?.metadata;
        if (!metadata) continue;

        // Handle different metadata formats
        // If it's an object from parseAleoStruct, extract the array values
        if (typeof metadata === 'object' && !Array.isArray(metadata)) {
            // Try to get array from object values
            const metadataValues = Object.values(metadata);
            if (metadataValues.length < 4) continue;
            metadata = metadataValues.slice(0, 4);
        }
        
        // If it's a string (from parseAleoStruct), skip for now
        if (typeof metadata === 'string') continue;
        
        // If it's already an array, use it
        if (!Array.isArray(metadata)) continue;

        try {
            const metadataKey = fieldsToString(
                metadata.map(field =>
                    BigInt(filterVisibility(String(field)).replace('field', ''))
                )
            );
            
            if (updatedMetadata[metadataKey]) continue;

            try {
                const response = await fetch(metadataKey);
                updatedMetadata[metadataKey] = await response.json();
            } catch (error) {
                console.log(`Error fetching metadata for post ${postId}: ${error.message}`);
            }
        } catch (e) {
            console.log(`Error processing metadata for post ${postId}:`, e);
        }
    }

    return {
        ...state,
        metadata: updatedMetadata,
    };
};
