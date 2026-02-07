# 🎥 PrivTok Leo Program

PrivTok is a decentralized, privacy-first content sharing and subscription platform built on Aleo. This Leo program manages the core logic for creators, content discovery, subscriptions, and private interactions.

## Overview

The PrivTok program enables a decentralized creator economy where:
- **Creators** can establish profiles and publish encrypted content.
- **Subscribers** can access content via public or private payments using ALEO credits or USDX.
- **Privacy** is maintained through zero-knowledge proofs and record-based access control.

## Key Features

### 1. Creator Management
- **Profiles**: Creators can initialize their identity on-chain with a name and bio.
- **Content Creation**: Creators can publish `PostTicket` records containing encrypted content metadata (off-chain URLs and nonces).
- **Access Control**: Configurable privacy levels (Private/Public), access types (One-time/Subscription), and payment tokens (ALEO/USDX).

### 2. Subscriptions
- **Public Subscriptions**: Users can subscribe using public transfers of ALEO credits or USDX.
- **Private Subscriptions**: Users can maintain financial privacy by subscribing using private record transfers.
- **Subscriber Access**: Successful subscriptions issue a `SubscriberAccess` record, which proves a user's right to decrypt and view content.

### 3. Private Interactions
- **Messages**: Users can send end-to-end encrypted messages to each other using the `Message` record.
- **Subscription Passes**: Creators can manually issue `SubscriptionPass` records to specific users, granting them access without a standard payment flow.

### 4. Discovery
- **Public Mappings**: The program maintains mappings for public posts and creator discovery, allowing frontend applications to index and display available content while keeping sensitive data private.

## Program Structure

### Data Structures
- `access_settings`: Defines how content is accessed and paid for.
- `creator_profile`: Stores basic creator information.
- `content_post`: Contains metadata for encrypted content.

### Record Types
- `CreatorTicket`: Proves ownership of a creator profile.
- `PostTicket`: Represents a specific piece of content managed by a creator.
- `SubscriberAccess`: A token granting a subscriber access to a post.
- `SubscriptionPass`: A private invite or pass to a post.
- `Message`: A private message between users.

## Running the Program

### Prerequisites
- [Leo CLI](https://github.com/ProvableHQ/leo) installed.
- An Aleo account with testnet credits.

### Build and Test
```bash
leo build
leo test
```

### Deployment
The program is designed to be deployed to the Aleo Testnet. Ensure your `.env` file is configured with a valid private key.

```bash
leo deploy
```

## Dependencies
- `credits.aleo`: Standard Aleo credits for payments.
- `test_usdcx_stablecoin.aleo`: USDX stablecoin support for payments.
