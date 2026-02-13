import { AleoNetworkClient } from "@provablehq/sdk";
import { PROGRAM_ID } from "../constants.js";
import { parseAleoStyle } from "../processing.js";

// Initialize the Aleo Network Client with the base V2 URL
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");

/**
 * Fetches public state using Provable API v2.
 */
async function fetchPublicState() {
    try {
        const result = {
            public_posts: [],
            post_access_settings: [],
            post_creators: [],
            sub_count: []
        };

        // 1. Fetch total count
        const countRaw = await networkClient.getProgramMappingValue(PROGRAM_ID, "public_post_count", "0u64");
        if (!countRaw) return result;
        const count = parseInt(countRaw.replace("u64", ""));

        // 2. Fetch indexed posts
        for (let i = 1; i <= count; i++) {
            try {
                const postId = await networkClient.getProgramMappingValue(PROGRAM_ID, "public_post_index", `${i}u64`);
                
                // Content Metadata
                const postData = await networkClient.getProgramMappingValue(PROGRAM_ID, "public_posts", postId);
                if (postData) {
                    result.public_posts.push({ id: postId, data: parseAleoStyle(postData) });
                }

                // Access Settings
                const accessData = await networkClient.getProgramMappingValue(PROGRAM_ID, "post_access_settings", postId);
                if (accessData) {
                    result.post_access_settings.push({ id: postId, data: parseAleoStyle(accessData) });
                }

                // Creator
                const creatorData = await networkClient.getProgramMappingValue(PROGRAM_ID, "post_creators", postId);
                if (creatorData) {
                    result.post_creators.push({ id: postId, data: creatorData });
                }

                // Sub Count
                const subData = await networkClient.getProgramMappingValue(PROGRAM_ID, "sub_count", postId);
                if (subData) {
                    result.sub_count.push({ id: postId, data: subData });
                }
            } catch (err) {
                console.warn(`Error fetching indexed post ${i}:`, err.message);
            }
        }

        return result;
    } catch (error) {
        console.error("Error fetching public state:", error);
        return { public_posts: [], post_access_settings: [], post_creators: [], sub_count: [] };
    }
}

function parsePublicPostState(state, publicData) {
    const posts = { ...state.posts };

    // Reducer logic
    const reducers = [
        {
            key: 'post_creators',
            fn: (id, data) => {
                posts[id] = { ...posts[id], creator: data, isPrivTok: true };
            }
        },
        {
            key: 'post_access_settings',
            fn: (id, data) => {
                const isPublic = data.privacy_level === '1field' || data.privacy_level === '1';
                posts[id] = {
                    ...posts[id],
                    isPublic,
                    accessKind: parseInt(data.access_kind.replace('field', '')),
                    tokenType: parseInt(data.token_type.replace('u8', '')),
                    isPrivTok: true
                };
            }
        },
        {
            key: 'sub_count',
            fn: (id, data) => {
                posts[id] = {
                    ...posts[id],
                    subscriptionCount: parseInt(data.replace('u64', '')),
                    isPrivTok: true
                };
            }
        },
        {
            key: 'public_posts',
            fn: (id, data) => {
                const priceStr = typeof data.price === 'string' ? data.price.replace('u128', '') : String(data.price);
                posts[id] = {
                    ...posts[id],
                    postId: id,
                    price: parseInt(priceStr),
                    name: data.content_id,
                    metadata: data.offchain_url,
                    nonce: data.nonce,
                    isPrivTok: true,
                    isPublic: true
                };
            }
        }
    ];

    reducers.forEach(({ key, fn }) => {
        const entries = publicData[key] || [];
        entries.forEach(entry => fn(entry.id, entry.data));
    });

    return {
        ...state,
        posts
    };
}

async function updatePublicState(state) {
    const privTokData = await fetchPublicState();
    return parsePublicPostState(state, privTokData);
}

export { fetchPublicState, updatePublicState, parsePublicPostState };
