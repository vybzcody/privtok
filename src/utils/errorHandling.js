/**
 * Centralized error handling utilities for PrivTok
 */

export class PrivTokError extends Error {
    constructor(message, code, userMessage, details) {
        super(message);
        this.name = 'PrivTokError';
        this.code = code;
        this.userMessage = userMessage;
        this.details = details;
    }
}

export const ErrorCodes = {
    // Encryption errors
    ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
    DECRYPTION_FAILED: 'DECRYPTION_FAILED',
    INVALID_KEY: 'INVALID_KEY',
    INVALID_NONCE: 'INVALID_NONCE',

    // Record errors
    CREATOR_RECORD_NOT_FOUND: 'CREATOR_RECORD_NOT_FOUND',
    SUBSCRIPTION_RECORD_NOT_FOUND: 'SUBSCRIPTION_RECORD_NOT_FOUND',
    SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
    RECORD_CONSUMPTION_FAILED: 'RECORD_CONSUMPTION_FAILED',

    // IPFS errors
    IPFS_UPLOAD_FAILED: 'IPFS_UPLOAD_FAILED',
    IPFS_DOWNLOAD_FAILED: 'IPFS_DOWNLOAD_FAILED',
    IPFS_TIMEOUT: 'IPFS_TIMEOUT',

    // Content errors
    CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
    INVALID_CONTENT_TYPE: 'INVALID_CONTENT_TYPE',

    // Wallet errors
    WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
};

export const ErrorMessages = {
    [ErrorCodes.ENCRYPTION_FAILED]: 'Failed to encrypt content. Please try again.',
    [ErrorCodes.DECRYPTION_FAILED]: 'Failed to decrypt content. Check your subscription status.',
    [ErrorCodes.INVALID_KEY]: 'Invalid encryption key. Please refresh and try again.',
    [ErrorCodes.INVALID_NONCE]: 'Invalid encryption nonce. Content may be corrupted.',
    [ErrorCodes.CREATOR_RECORD_NOT_FOUND]: 'Creator record not found. Please register as a creator first.',
    [ErrorCodes.SUBSCRIPTION_RECORD_NOT_FOUND]: 'Subscription not found. Please subscribe to access this content.',
    [ErrorCodes.SUBSCRIPTION_EXPIRED]: 'Your subscription has expired. Please renew to continue.',
    [ErrorCodes.RECORD_CONSUMPTION_FAILED]: 'Failed to process record. Please try again.',
    [ErrorCodes.IPFS_UPLOAD_FAILED]: 'Failed to upload content. Please check your connection.',
    [ErrorCodes.IPFS_DOWNLOAD_FAILED]: 'Failed to download content. Please try again.',
    [ErrorCodes.IPFS_TIMEOUT]: 'Content download timed out. Please try again.',
    [ErrorCodes.CONTENT_NOT_FOUND]: 'Content not found or has been removed.',
    [ErrorCodes.INVALID_CONTENT_TYPE]: 'Unsupported content type.',
    [ErrorCodes.WALLET_NOT_CONNECTED]: 'Please connect your wallet to continue.',
    [ErrorCodes.TRANSACTION_FAILED]: 'Transaction failed. Please try again.',
    [ErrorCodes.INSUFFICIENT_BALANCE]: 'Insufficient balance to complete this transaction.',
};

/**
 * Create a user-friendly error from any error type
 */
export function createUserError(error, defaultCode = 'TRANSACTION_FAILED') {
    // If it's already a PrivTokError, return it
    if (error instanceof PrivTokError) {
        return error;
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        // Check for specific error patterns
        if (error.message.includes('wallet') || error.message.includes('connect')) {
            return new PrivTokError(
                error.message,
                ErrorCodes.WALLET_NOT_CONNECTED,
                ErrorMessages[ErrorCodes.WALLET_NOT_CONNECTED]
            );
        }

        if (error.message.includes('balance') || error.message.includes('insufficient')) {
            return new PrivTokError(
                error.message,
                ErrorCodes.INSUFFICIENT_BALANCE,
                ErrorMessages[ErrorCodes.INSUFFICIENT_BALANCE]
            );
        }

        if (error.message.includes('expired')) {
            return new PrivTokError(
                error.message,
                ErrorCodes.SUBSCRIPTION_EXPIRED,
                ErrorMessages[ErrorCodes.SUBSCRIPTION_EXPIRED]
            );
        }

        if (error.message.includes('record') && error.message.includes('not found')) {
            return new PrivTokError(
                error.message,
                ErrorCodes.CREATOR_RECORD_NOT_FOUND,
                ErrorMessages[ErrorCodes.CREATOR_RECORD_NOT_FOUND]
            );
        }

        if (error.message.includes('decrypt')) {
            return new PrivTokError(
                error.message,
                ErrorCodes.DECRYPTION_FAILED,
                ErrorMessages[ErrorCodes.DECRYPTION_FAILED]
            );
        }

        if (error.message.includes('encrypt')) {
            return new PrivTokError(
                error.message,
                ErrorCodes.ENCRYPTION_FAILED,
                ErrorMessages[ErrorCodes.ENCRYPTION_FAILED]
            );
        }

        if (error.message.includes('IPFS') || error.message.includes('ipfs')) {
            return new PrivTokError(
                error.message,
                ErrorCodes.IPFS_DOWNLOAD_FAILED,
                ErrorMessages[ErrorCodes.IPFS_DOWNLOAD_FAILED]
            );
        }

        // Default error
        return new PrivTokError(
            error.message,
            defaultCode,
            ErrorMessages[defaultCode] || 'An error occurred'
        );
    }

    // Unknown error type
    return new PrivTokError(
        'An unknown error occurred',
        defaultCode,
        ErrorMessages[defaultCode] || 'An error occurred'
    );
}

/**
 * Log error with context
 */
export function logError(context, error, additionalInfo) {
    const privTokError = createUserError(error);

    console.error(`[${context}] Error:`, {
        code: privTokError.code,
        message: privTokError.message,
        userMessage: privTokError.userMessage,
        details: privTokError.details,
        ...additionalInfo
    });
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error) {
    const privTokError = createUserError(error);
    return privTokError.userMessage;
}