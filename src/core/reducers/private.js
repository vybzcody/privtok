import { filterVisibility as f } from "../processing.js";

/**
 * Parse Aleo struct string into object
 */
function parseAleoStruct(structStr) {
    if (typeof structStr !== 'string') return structStr;
    const result = {};
    const matches = structStr.matchAll(/(\w+):\s*([^,}]+)/g);
    for (const [_, key, value] of matches) {
        result[key.trim()] = value.trim();
    }
    return result;
}

/**
 * Standardize record format across different wallet adapters
 */
function standardizeRecords(records, nameKey) {
    return (records || []).filter(r => {
        const hasName = r[nameKey] || r.recordName || r.name;
        const hasPlaintext = r.recordPlaintext || r.plaintext;
        return hasName && hasPlaintext;
    }).map(r => {
        const recordName = r[nameKey] || r.recordName || r.name;
        let plaintext = r.recordPlaintext || r.plaintext || "";
        let data = {};
        if (typeof plaintext === "string" && plaintext.trim()) {
            data = parseAleoStruct(plaintext.trim().replace(/\.$/, ''));
        }
        return {
            ...r,
            plaintext,
            data,
            recordName
        };
    });
}

function updateStateFromRecords(state, records, walletName) {
    const nameKey = walletName === "Puzzle Wallet" ? "name" : "recordName";
    
    console.log("[PrivateReducer] Raw records from wallet:", records?.length);
    if (records?.length > 0) {
        console.log("[PrivateReducer] Sample first record keys:", Object.keys(records[0]));
        console.log("[PrivateReducer] Sample first record name:", records[0][nameKey] || records[0].recordName || records[0].name);
    }

    const standardized = standardizeRecords(records, nameKey);

    if (standardized.length > 0) {
        console.log("[PrivateReducer] Standardized record names:", [...new Set(standardized.map(r => r.recordName))]);
    }

    // Filter PrivTok Subscription Records
    const creatorTickets = standardized.filter(r => r.recordName === "CreatorTicket");
    if (creatorTickets.length > 0) {
        console.log("[PrivateReducer] FOUND CreatorTickets:", creatorTickets.length);
    }
    const postTickets = standardized.filter(r => r.recordName === "PostTicket");
    const subscriberAccess = standardized.filter(r => r.recordName === "SubscriberAccess");
    const subscriptionPasses = standardized.filter(r => r.recordName === "SubscriptionPass");
    const messageRecords = standardized.filter(r => r.recordName === "Message");

    console.log("[PrivateReducer] Record counts:", {
        creator: creatorTickets.length,
        posts: postTickets.length,
        access: subscriberAccess.length,
        passes: subscriptionPasses.length,
        messages: messageRecords.length
    });

    // 1. Process Creator's own posts
    const userPosts = {};
    const userPostIds = new Set();
    postTickets.forEach(record => {
        const postId = f(record.data.post_id);
        const postData = record.data.post ? parseAleoStruct(record.data.post) : {};
        
        userPosts[postId] = {
            postId,
            creator: record.owner,
            name: f(postData.content_id || ""),
            metadata: f(postData.offchain_url || ""),
            nonce: f(postData.nonce || ""),
            price: parseInt(f(postData.price || "0u128").replace("u128", "")),
            isCreator: true,
            record
        };
        userPostIds.add(postId);
    });

    // 2. Process Unlocked Content (Access Records)
    const unlockedContent = subscriberAccess.map(access => {
        const postId = f(access.data.post_id);
        const postData = access.data.post ? parseAleoStruct(access.data.post) : {};
        const expiry = parseInt(f(access.data.expiry || "0u32").replace("u32", ""));
        const tokenType = parseInt(f(access.data.token_type || "0u8").replace("u8", ""));

        return {
            postId,
            subscriber: access.owner,
            tokenType,
            expiry,
            isExpired: expiry > 0 && state.currentBlock > expiry,
            postData: {
                contentId: f(postData.content_id),
                offchainUrl: f(postData.offchain_url),
                nonce: f(postData.nonce),
                price: f(postData.price)
            },
            record: access
        };
    });

    // 3. Process Subscription Passes (Invites)
    const activePasses = subscriptionPasses.map(pass => {
        const postId = f(pass.data.post_id);
        const postData = pass.data.post ? parseAleoStruct(pass.data.post) : {};
        
        return {
            postId,
            creator: f(pass.data.creator),
            price: parseInt(f(postData.price || "0u128").replace("u128", "")),
            tokenType: parseInt(f(pass.data.settings ? parseAleoStruct(pass.data.settings).token_type : "0u8").replace("u8", "")),
            record: pass
        };
    });

    // 4. Process Message Records
    const messages = messageRecords.map(record => {
        return {
            id: record.id,
            sender: f(record.data.sender),
            recipient: f(record.owner), // owner is recipient
            text: record.data.text, // array of fields
            timestamp: Date.now(), // approximation
            record
        };
    });

    // Merge into global state
    const mergedPosts = { ...state.posts };
    Object.assign(mergedPosts, userPosts);

    return {
        ...state,
        posts: mergedPosts,
        creatorTickets,
        postTickets,
        subscriberAccess,
        subscriptionPasses,
        userPostIds,
        unlockedContent,
        activePasses,
        messages,
        hasProfile: creatorTickets.length > 0
    };
}

export { updateStateFromRecords };
