/**
 * Storacha IPFS Service
 * 
 * Handles IPFS file upload and retrieval using Storacha (Web3.Storage)
 * Reference: reference_ui/services/storacha.ts
 */

import { create } from '@storacha/client';
import * as Proof from '@storacha/client/proof';
import * as Signer from '@storacha/client/principal/ed25519';
import { StoreMemory } from '@storacha/client/stores/memory';
import { toast } from 'sonner';

// Multiple IPFS gateways for redundancy
const IPFS_GATEWAYS = [
  (cid) => `https://${cid}.ipfs.storacha.link`,
  (cid) => `https://w3s.link/ipfs/${cid}`,
  (cid) => `https://ipfs.io/ipfs/${cid}`,
];

class StorachaService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    const key = import.meta.env.VITE_STORACHA_KEY;
    const proof = import.meta.env.VITE_STORACHA_PROOF;
    const spaceDid = import.meta.env.VITE_STORACHA_SPACE_DID;

    if (!key || !proof || !spaceDid) {
      console.warn('Storacha configuration missing. Uploads will not work until .env is set up.');
      return;
    }

    try {
      const principal = Signer.parse(key);
      const store = new StoreMemory();
      this.client = await create({ principal, store });

      const parsedProof = await Proof.parse(proof);
      const space = await this.client.addSpace(parsedProof);
      await this.client.setCurrentSpace(space.did());

      this.initialized = true;
      console.log('Storacha initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Storacha:', error);
      throw new Error(`Failed to connect to Storacha: ${error.message}`);
    }
  }

  /**
   * Upload a file to IPFS via Storacha
   * @param {File} file - The file to upload
   * @returns {Promise<string>} - IPFS CID
   */
  async upload(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.client) {
        throw new Error('Storacha client not initialized. Check your environment variables.');
      }

      toast.info('Uploading to IPFS via Storacha...');

      const cid = await this.client.uploadFile(file);

      return cid.toString();
    } catch (error) {
      console.error('Storacha upload failed:', error);
      toast.error(`Failed to upload to IPFS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get IPFS gateway URL for a CID
   * @param {string} cid - IPFS CID
   * @returns {string} - IPFS gateway URL
   */
  getGatewayUrl(cid) {
    return `https://w3s.link/ipfs/${cid}`;
  }

  /**
   * Fetch JSON from IPFS
   * @param {string} cid - IPFS CID
   * @returns {Promise<object>} - JSON data
   */
  async getJSON(cid) {
    try {
      const response = await fetch(this.getGatewayUrl(cid));
      if (!response.ok) {
        throw new Error('Failed to fetch from gateway');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch IPFS metadata:', error);
      // Try fallback gateway
      try {
        const fallbackUrl = `https://ipfs.io/ipfs/${cid}`;
        const response = await fetch(fallbackUrl);
        return await response.json();
      } catch (err) {
        throw error;
      }
    }
  }
}

export const storacha = new StorachaService();
