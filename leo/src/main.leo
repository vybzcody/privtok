import credits.aleo;
import test_usdcx_stablecoin.aleo;

// PrivTok v2: A private content sharing and subscription platform.
program privtok_decentrix_platformv9.aleo {

    @admin(address="aleo1ewwhmgm4mr3aq3sclxzs53axghxazlhhwtt8a3jsruum5ul54qxsxuqz83")
    async constructor() {}

    ////////////////////////////////////////
    ///// ----- DATA DEFINITIONS ----- /////
    ////////////////////////////////////////

    // Access control settings for content.
    // - `privacy_level`   : 0 = Private (Pass only), 1 = Public (Discoverable).
    // - `access_kind`     : 0 = One-time purchase, 1 = Subscription (Time-bound).
    // - `token_type`      : 0 = ALEO Credits, 1 = USDX Stablecoin.
    struct access_settings {
        privacy_level: field,
        access_kind: field,
        token_type: u8,
    }

    struct MerkleProof {
        siblings: [field; 16],
        leaf_index: u32,
    }

    // Description of a creator's profile.
    struct creator_profile {
        name: field,
        bio: [field; 4],
    }

    // Description of a content post.
    struct content_post {
        creator_id: field,
        content_id: field,
        price: u128, 
        offchain_url: [field; 4], // Encrypted content link (IPFS/Arweave)
        nonce: [field; 2], // 12-byte nonce for AES-GCM
    }

    ///////////////////////////////////
    ///// ----- PUBLIC DATA ----- /////
    ///////////////////////////////////

    // Subscription count for a post.
    mapping sub_count: field => u64;

    // Post mapping identifying the creator address for a given post.
    mapping post_creators: field => address;

    // Post mapping for public posts, allows discovery of content.
    mapping public_posts: field => content_post;

    // Determine access settings for posts.
    mapping post_access_settings: field => access_settings;

    // --- Discovery Mappings (Privacy-Safe) ---
    mapping public_post_count: u64 => u64;
    mapping public_post_index: u64 => field;
    mapping is_creator: address => bool;
    mapping creator_post_count: address => u64;
    mapping creator_posts: field => field;

    ////////////////////////////////////
    ///// ----- RECORD TYPES ----- /////
    ////////////////////////////////////

    // Record proving ownership of a creator's profile.
    record CreatorTicket {
        owner: address,
        profile: creator_profile,
    }

    // Record representing a specific post managed by a creator.
    record PostTicket {
        owner: address,
        post: content_post,
        post_id: field,
    }

    // Record given to a subscriber to prove they have access to specific content.
    record SubscriberAccess {
        owner: address,
        post_id: field,
        subscriber: address,
        post: content_post,
        token_type: u8,
        expiry: u32, // 0 for permanent, or block_height for expiry
    }

    // A private subscription pass to a post.
    record SubscriptionPass {
        owner: address,
        post: content_post,
        creator: address,
        post_id: field,
        settings: access_settings,
    }

    // A private message sent between users.
    record Message {
        owner: address, // The recipient
        sender: address,
        text: [field; 4], // Encrypted message content
    }

    ///////////////////////////////////
    ///// ----- TRANSITIONS ----- /////
    ///////////////////////////////////

    // Send a private message to another user.
    transition send_message(
        recipient: address,
        text: [field; 4]
    ) -> Message {
        return Message {
            owner: recipient,
            sender: self.signer,
            text: text,
        };
    }

    // Initializes a creator profile.
    async transition create_creator_profile(
        name: field,
        bio: [field; 4]
    ) -> (CreatorTicket, Future) {
        let profile: creator_profile = creator_profile { name, bio };
        return (CreatorTicket {
            owner: self.signer,
            profile,
        }, finalize_create_creator_profile(self.signer));
    }
    async function finalize_create_creator_profile(creator: address) {
        is_creator.set(creator, true);
    }

    // Allows a creator to "publish" new content.
    async transition create_content_post(
        price: u128,
        content_id: field,
        offchain_url: [field; 4],
        nonce: [field; 2],
        privacy_level: field,
        access_kind: field,
        token_type: u8
    ) -> (PostTicket, Future) {
        let post: content_post = content_post {
            creator_id: (self.signer as group) as field,
            content_id,
            price,
            offchain_url,
            nonce,
        };

        let post_id: field = Poseidon2::hash_to_scalar(post) as field;
        let settings: access_settings = access_settings {
            privacy_level,
            access_kind,
            token_type,
        };

        let post_ticket: PostTicket = PostTicket {
            owner: self.signer,
            post,
            post_id,
        };

        return (post_ticket, finalize_create_content_post(post, post_id, self.signer, settings));
    }

    async function finalize_create_content_post(post_data: content_post, post_id: field, creator: address, settings: access_settings) {
        post_creators.set(post_id, creator);
        post_access_settings.set(post_id, settings);

        if settings.privacy_level == 1field {
            public_posts.set(post_id, post_data);
            let public_count: u64 = Mapping::get_or_use(public_post_count, 0u64, 0u64);
            let new_public_count: u64 = public_count + 1u64;
            public_post_count.set(0u64, new_public_count);
            public_post_index.set(new_public_count, post_id);
            
            let creator_count: u64 = Mapping::get_or_use(creator_post_count, creator, 0u64);
            let new_creator_count: u64 = creator_count + 1u64;
            creator_post_count.set(creator, new_creator_count);
            
            let creator_field: field = (creator as group) as field;
            let post_key: field = Poseidon2::hash_to_scalar([creator_field, (new_creator_count as field)]) as field;
            creator_posts.set(post_key, post_id);
        }
        is_creator.set(creator, true);
    }

    // PUBLIC SUBSCRIPTION (ALEO Credits)
    async transition subscribe_public_credits(
        post_id: field,
        price: u128,
        creator: address,
        offchain_url: [field; 4],
        nonce: [field; 2]
    ) -> (SubscriberAccess, Future) {
        let payment_future: Future = credits.aleo/transfer_public_as_signer(creator, price as u64);

        let post: content_post = content_post {
            creator_id: (creator as group) as field,
            content_id: post_id,
            price,
            offchain_url,
            nonce,
        };

        let access: SubscriberAccess = SubscriberAccess {
            owner: self.signer,
            post_id,
            subscriber: self.signer,
            post,
            token_type: 0u8,
            expiry: 0u32,
        };

        return (access, finalize_increment_subs(post_id, payment_future));
    }

    // PUBLIC SUBSCRIPTION (USDX)
    async transition subscribe_public_usdx(
        post_id: field,
        price: u128,
        creator: address,
        offchain_url: [field; 4],
        nonce: [field; 2]
    ) -> (SubscriberAccess, Future) {
        let payment_future: Future = test_usdcx_stablecoin.aleo/transfer_public_as_signer(creator, price);

        let post: content_post = content_post {
            creator_id: (creator as group) as field,
            content_id: post_id,
            price,
            offchain_url,
            nonce,
        };

        let access: SubscriberAccess = SubscriberAccess {
            owner: self.signer,
            post_id,
            subscriber: self.signer,
            post,
            token_type: 1u8,
            expiry: 0u32,
        };

        return (access, finalize_increment_subs(post_id, payment_future));
    }

    async function finalize_increment_subs(post_id: field, payment_future: Future) {
        payment_future.await();
        let current_subs: u64 = Mapping::get_or_use(sub_count, post_id, 0u64);
        sub_count.set(post_id, current_subs + 1u64);
    }

    // PRIVATE SUBSCRIPTION (ALEO Credits)
    async transition subscribe_private_credits(
        payment_record: credits.aleo/credits,
        post_id: field,
        price: u128,
        creator: address,
        offchain_url: [field; 4],
        nonce: [field; 2]
    ) -> (SubscriberAccess, credits.aleo/credits, Future) {
        let (recipient, change): (credits.aleo/credits, credits.aleo/credits) = credits.aleo/transfer_private(payment_record, creator, price as u64);

        let post: content_post = content_post {
            creator_id: (creator as group) as field,
            content_id: post_id,
            price,
            offchain_url,
            nonce,
        };

        let access: SubscriberAccess = SubscriberAccess {
            owner: self.signer,
            post_id,
            subscriber: self.signer,
            post,
            token_type: 0u8,
            expiry: 0u32,
        };

        return (access, change, finalize_sub_count_only(post_id));
    }

    // PRIVATE SUBSCRIPTION (USDX)
    async transition subscribe_private_usdx(
        payment_record: test_usdcx_stablecoin.aleo/Token,
        post_id: field,
        price: u128,
        creator: address,
        offchain_url: [field; 4],
        nonce: [field; 2],
        proofs: [MerkleProof; 2]
    ) -> (SubscriberAccess, test_usdcx_stablecoin.aleo/Token, test_usdcx_stablecoin.aleo/Token, test_usdcx_stablecoin.aleo/ComplianceRecord, Future) {
        
        let (compliance, recipient, change, payment_future): (test_usdcx_stablecoin.aleo/ComplianceRecord, test_usdcx_stablecoin.aleo/Token, test_usdcx_stablecoin.aleo/Token, Future) = 
            test_usdcx_stablecoin.aleo/transfer_private(creator, price, payment_record, proofs);

        let post: content_post = content_post {
            creator_id: (creator as group) as field,
            content_id: post_id,
            price,
            offchain_url,
            nonce,
        };

        let access: SubscriberAccess = SubscriberAccess {
            owner: self.signer,
            post_id,
            subscriber: self.signer,
            post,
            token_type: 1u8,
            expiry: 0u32,
        };

        return (access, recipient, change, compliance, finalize_increment_subs(post_id, payment_future));
    }

    async function finalize_sub_count_only(post_id: field) {
        let current_subs: u64 = Mapping::get_or_use(sub_count, post_id, 0u64);
        sub_count.set(post_id, current_subs + 1u64);
    }

    // Issues a private subscription pass to a user.
    transition issue_subscription_pass(
        post_ticket: PostTicket,
        invitee: address
    ) -> (SubscriptionPass, PostTicket) {
        let pass: SubscriptionPass = SubscriptionPass {
            owner: invitee,
            creator: post_ticket.owner,
            post: post_ticket.post,
            post_id: post_ticket.post_id,
            settings: access_settings { privacy_level: 0field, access_kind: 0field, token_type: 0u8 },
        };

        let new_post_ticket: PostTicket = PostTicket {
            owner: post_ticket.owner,
            post: post_ticket.post,
            post_id: post_ticket.post_id,
        };

        return (pass, new_post_ticket);
    }
}
