import { AleoNetworkClient, Field, Poseidon2 } from "@provablehq/sdk";
import { PROGRAM_ID } from "../core/constants.js";

// Initialize the network client (testnet)
const networkClient = new AleoNetworkClient("https://api.provable.com/v2");

/**
 * Generic mapping value fetcher
 */
export const getMappingValue = async (mappingName, key, programId = PROGRAM_ID) => {
  try {
    const url = `${networkClient.host}/testnet/program/${programId}/mapping/${mappingName}/${key}`;
    console.log(`[AleoService] Fetching mapping from: ${url}`);
    const result = await networkClient.getProgramMappingValue(programId, mappingName, key);
    console.log(`[AleoService] Mapping response for ${mappingName}[${key}]:`, result);
    return result;
  } catch (error) {
    console.warn(`[AleoService] Mapping fetch fail (possibly not found): ${programId}/${mappingName}[${key}]`, error.message);
    return null;
  }
};

/**
 * Check if an address is a creator
 */
export const checkIsCreator = async (address) => {
  if (!address || (typeof address !== 'string' && !address.toString)) return false;
  const addrStr = address.toString();
  if (!addrStr.startsWith('aleo1')) return false;

  const result = await getMappingValue('is_creator', addrStr);
  console.log(`[AleoService] checkIsCreator raw result:`, result);

  if (result === null || result === undefined) return false;

  // Normalize result: strip .public/.private and convert to string
  const cleanResult = String(result).replace(".public", "").replace(".private", "").trim();
  console.log(`[AleoService] checkIsCreator normalized:`, cleanResult);
  return cleanResult === "true" || cleanResult === "true.public" || cleanResult === "true.private";
};

/**
 * Get total public post count
 */
export const getPublicPostCount = async () => {
  const result = await getMappingValue('public_post_count', '0u64');
  if (!result) return 0;
  return parseInt(result.replace("u64", ""));
};

/**
 * Get creator post count
 */
export const getCreatorPostCount = async (address) => {
  const result = await getMappingValue('creator_post_count', address);
  if (!result) return 0;
  return parseInt(result.replace("u64", ""));
};

/**
 * Fetch all public posts and filter (fallback discovery)
 */
export const fetchAllPublicPosts = async () => {
  const count = await getPublicPostCount();
  if (count === 0) return [];

  const posts = [];
  // Fetch in reverse to get newest first
  for (let i = count; i >= 1; i--) {
    try {
      const postId = await getMappingValue('public_post_index', `${i}u64`);
      if (postId) {
        const postDataRaw = await getMappingValue('public_posts', postId);
        if (postDataRaw) {
          posts.push({
            id: postId,
            postId: postId.replace("field", ""),
            rawData: postDataRaw,
            // Basic parsing of the struct string if possible
            // We'll improve this as needed
          });
        }
      }
    } catch (e) {
      console.error(`Error fetching post ${i}:`, e);
    }
  }
  return posts;
};

export default networkClient;
