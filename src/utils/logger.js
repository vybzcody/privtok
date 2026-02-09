/**
 * Centralized logging utility for PrivTok
 * Set DEBUG to false in production to disable all logs
 */

const DEBUG = import.meta.env.DEV; // Only log in development

class Logger {
    constructor(prefix) {
        this.prefix = `[${prefix}]`;
    }

    logWithLevel(level, ...args) {
        if (!DEBUG && level !== 'error') return;

        const method = console[level] || console.log;
        method(this.prefix, ...args);
    }

    log(...args) {
        this.logWithLevel('log', ...args);
    }

    info(...args) {
        this.logWithLevel('info', ...args);
    }

    warn(...args) {
        this.logWithLevel('warn', ...args);
    }

    error(...args) {
        // Always log errors, even in production
        console.error(this.prefix, ...args);
    }
}

// Export logger instances for different modules
export const aleoLogger = new Logger('ALEO');
export const encryptionLogger = new Logger('ENCRYPTION');
export const decryptionLogger = new Logger('DECRYPTION');
export const subscriptionLogger = new Logger('SUBSCRIPTION');
export const creatorLogger = new Logger('CREATOR');
export const contentLogger = new Logger('CONTENT');
export const uploadLogger = new Logger('UPLOAD');
export const ipfsLogger = new Logger('IPFS');