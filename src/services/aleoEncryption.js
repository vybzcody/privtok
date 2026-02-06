/**
 * Aleo Content Encryption Service
 * Implements AES-GCM encryption with keys derived from Aleo identities
 */

import { toast } from 'sonner';

export class AleoEncryption {
    /**
     * Derives a 32-byte encryption key from a seed (usually a wallet signature)
     */
    static async deriveKey(seed) {
        const encoder = new TextEncoder();
        const seedBytes = typeof seed === 'string' ? encoder.encode(seed) : seed;
        
        // Use SHA-256 to ensure we have a fixed-length 32-byte key
        const hashBuffer = await crypto.subtle.digest('SHA-256', seedBytes);
        
        return await crypto.subtle.importKey(
            'raw',
            hashBuffer,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts a File or Blob
     * @param {File|Blob} file 
     * @param {string|Uint8Array} seed 
     * @returns {Promise<{encryptedBlob: Blob, nonce: Uint8Array}>}
     */
    static async encryptFile(file, seed) {
        try {
            const key = await this.deriveKey(seed);
            const nonce = crypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce for AES-GCM
            const fileData = await file.arrayBuffer();

            const encryptedBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: nonce },
                key,
                fileData
            );

            return {
                encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
                nonce: nonce
            };
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypts an encrypted buffer
     * @param {ArrayBuffer} encryptedData 
     * @param {Uint8Array} nonce 
     * @param {string|Uint8Array} seed 
     * @returns {Promise<ArrayBuffer>}
     */
    static async decryptData(encryptedData, nonce, seed) {
        try {
            const key = await this.deriveKey(seed);
            
            return await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: nonce },
                key,
                encryptedData
            );
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error(`Decryption failed: ${error.message}. Ensure you have the correct access rights.`);
        }
    }

    /**
     * Helper to convert Uint8Array nonce to Field array for Leo
     * 12 bytes -> 2 fields (8 bytes + 4 bytes)
     */
    static nonceToFields(nonce) {
        // Simple packing: first 8 bytes into field1, next 4 bytes into field2
        const f1 = new DataView(nonce.buffer).getBigUint64(0, true);
        const f2 = new DataView(nonce.buffer).getUint32(8, true);
        return [f1.toString() + "field", f2.toString() + "field"];
    }

    /**
     * Helper to convert Field array back to Uint8Array nonce
     */
    static fieldsToNonce(f1Str, f2Str) {
        const nonce = new Uint8Array(12);
        const f1 = BigInt(f1Str.replace('field', ''));
        const f2 = BigInt(f2Str.replace('field', ''));
        
        new DataView(nonce.buffer).setBigUint64(0, f1, true);
        new DataView(nonce.buffer).setUint32(8, Number(f2), true);
        
        return nonce;
    }
}
