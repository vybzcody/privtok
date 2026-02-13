import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import {
  fetchPublicState,
  parsePublicPostState,
} from "../core/reducers/public.js";
import { updateStateFromRecords } from "../core/reducers/private.js";
import { checkIsCreator } from "../services/aleoService.js";
import { PROGRAM_ID } from "../core/constants.js";

/**
 * Hook to fetch all public posts and their access settings
 */
export const usePublicPosts = () => {
  return useQuery({
    queryKey: ["privtok", "publicPosts"],
    queryFn: async () => {
      console.log("[Query] Fetching public state...");
      const publicData = await fetchPublicState();
      // We pass an empty initial state to the parser
      const initialState = { posts: {} };
      const result = parsePublicPostState(initialState, publicData);
      return result.posts;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
};

/**
 * Hook to check if the current user is a creator via public mapping
 */
export const useIsCreator = () => {
  const { publicKey: address, connected } = useWallet();
  return useQuery({
    queryKey: ["privtok", "isCreator", address],
    queryFn: async () => {
      if (!connected || !address) {
        console.log(
          "[Query] useIsCreator: skipping (not connected or no address)",
        );
        return false;
      }
      console.log(
        "[Query] Checking mapping is_creator for:",
        address.toString(),
      );
      try {
        const result = await checkIsCreator(address.toString());
        console.log(
          "[Query] Mapping check result for",
          address.toString(),
          ":",
          result,
        );
        return result;
      } catch (err) {
        console.error("[Query] Error in useIsCreator:", err);
        return false;
      }
    },
    enabled: connected && !!address,
    staleTime: 0,
    retry: 2,
    retryDelay: 1000,
  });
};

/**
 * Hook to fetch and process all user records for PrivTok
 */
export const useUserRecords = () => {
  const { requestRecords, wallet, connected, address: publicKey } = useWallet();

  console.log(
    "[useUserRecords] Before query - connected:",
    connected,
    "publicKey:",
    !!publicKey,
    "requestRecords:",
    typeof requestRecords,
  );

  return useQuery({
    queryKey: ["privtok", "userRecords", publicKey],
    queryFn: async () => {
      if (!connected || !publicKey) {
        console.log(
          "[useUserRecords] Skipping - not connected or no publicKey",
        );
        return null;
      }
      if (!requestRecords) {
        console.error("[useUserRecords] ERROR - requestRecords is undefined!");
        return null;
      }

      console.log(
        "[Query] Fetching private records for:",
        publicKey?.toString(),
      );
      try {
        const records = await requestRecords(PROGRAM_ID, true);
        console.log(
          "[Query] Private records fetched:",
          records?.length,
          "records",
        );
        const walletName = wallet?.adapter?.name;

        // Pass minimal state for reduction
        const initialState = { posts: {}, currentBlock: 0 };
        const result = updateStateFromRecords(
          initialState,
          records,
          walletName,
        );

        console.log(
          "[Query] Processed private data - creatorTickets:",
          result?.creatorTickets?.length,
        );
        return result;
      } catch (err) {
        console.error("[Query] Error fetching private records:", err);
        throw err;
      }
    },
    enabled: connected && !!publicKey,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};
