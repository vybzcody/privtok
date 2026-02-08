import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import {
  usePublicPosts,
  useUserRecords,
  useIsCreator,
} from "../hooks/usePrivTokQueries.js";
import { stringToFieldInputs, encodeStringAsField } from "../core/encoder.js";
import { filterVisibility, filterVisibility as f } from "../core/processing.js";
import {
  waitTransactionConfirmation,
  createTransaction,
} from "../core/transaction.js";
import { toast } from "sonner";
import { PROGRAM_ID } from "../core/constants.js";

const PrivTokContext = createContext({});

export const usePrivTokState = () => {
  const context = useContext(PrivTokContext);
  if (!context) {
    throw new Error("usePrivTokState must be used within a PrivTokProvider");
  }
  return context;
};

export const PrivTokProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const {
    connected,
    address: publicKey,
    requestRecords,
    executeTransaction,
    transactionStatus,
  } = useWallet();

  // Initialize dashboardMode from localStorage or default to 'user'
  const [dashboardMode, setDashboardModeInternal] = useState(() => {
    const saved = localStorage.getItem("privtok_dashboard_mode");
    return saved || "user";
  });

  const setDashboardMode = (mode) => {
    console.log(`[PrivTokState] Manually setting dashboardMode to: ${mode}`);
    localStorage.setItem("privtok_dashboard_mode", mode);
    setDashboardModeInternal(mode);
  };

  // 1. DATA QUERIES
  const {
    data: publicPosts = {},
    isLoading: isLoadingPublic,
    isFetching: isFetchingPublic,
    refetch: refetchPublic,
  } = usePublicPosts();

  const {
    data: privateData,
    isLoading: isLoadingPrivate,
    isFetching: isFetchingPrivate,
    refetch: refetchPrivate,
  } = useUserRecords();

  const {
    data: isPublicCreator = false,
    isLoading: isLoadingPublicCreator,
    isFetching: isFetchingPublicCreator,
    refetch: refetchIsCreator,
  } = useIsCreator();

  // RESET ON DISCONNECT
  useEffect(() => {
    if (!connected) {
      localStorage.removeItem("privtok_dashboard_mode");
      setDashboardModeInternal("user");
    }
  }, [connected]);

  // 2. DERIVED STATE
  const privTokState = useMemo(() => {
    // Merge public and private post data
    const mergedPosts = { ...publicPosts };
    if (privateData?.posts) {
      Object.keys(privateData.posts).forEach((id) => {
        mergedPosts[id] = {
          ...mergedPosts[id],
          ...privateData.posts[id],
          isCreator: true, // If it's in privateData.posts, the user owns the PostTicket
        };
      });
    }

    const isLoading =
      isLoadingPublic || isLoadingPrivate || isLoadingPublicCreator;
    const isFetching =
      isFetchingPublic || isFetchingPrivate || isFetchingPublicCreator;

    // User has profile if they are in the public is_creator mapping OR have a private CreatorTicket
    const hasCreatorTicket = privateData?.creatorTickets?.length > 0;
    const hasProfile = isPublicCreator === true || hasCreatorTicket;

    const state = {
      posts: mergedPosts,
      creatorTickets: privateData?.creatorTickets || [],
      postTickets: privateData?.postTickets || [],
      subscriberAccess: privateData?.subscriberAccess || [],
      subscriptionPasses: privateData?.subscriptionPasses || [],
      unlockedContent: privateData?.unlockedContent || [],
      activePasses: privateData?.activePasses || [],
      messages: privateData?.messages || [],
      hasProfile,
      isPublicCreator, // Expose this directly
      dashboardMode,
      // If we already know they have a profile, we can consider it "loaded"
      hasLoaded: !isLoading || hasProfile,
      isLoading: (isLoading || isFetching) && !hasProfile,
      isFetching: isFetching,
    };

    console.log("[PrivTokState] Updated Final State:", {
      hasProfile: state.hasProfile,
      hasCreatorTicket,
      isPublicCreator,
      isLoading: state.isLoading,
      isFetching: state.isFetching,
      dashboardMode: state.dashboardMode,
      creatorTicketsCount: privateData?.creatorTickets?.length,
    });

    return state;
  }, [
    publicPosts,
    privateData,
    isPublicCreator,
    isLoadingPublic,
    isLoadingPrivate,
    isLoadingPublicCreator,
    isFetchingPublic,
    isFetchingPrivate,
    isFetchingPublicCreator,
    dashboardMode,
  ]);

  // AUTO-SWITCH MODE IF PROFILE DETECTED
  useEffect(() => {
    // Only auto-switch if we explicitly detect they are a creator
    // We use privTokState.hasProfile which checks both mapping and private tickets
    if (privTokState.hasProfile === true && dashboardMode !== "creator") {
      console.log(
        "[PrivTokState] Creator profile detected (mapping or ticket), auto-switching to creator mode.",
      );
      setDashboardMode("creator");
    }
  }, [privTokState.hasProfile, dashboardMode]);

  // 3. REFRESH HELPER
  const updateState = async (forcePrivate = true) => {
    const promises = [refetchPublic(), refetchIsCreator()];
    if (forcePrivate && connected) {
      promises.push(refetchPrivate());
    }
    await Promise.all(promises);
  };

  // 4. ACTIONS
  const createProfile = async (name, bio) => {
    const toastId = toast.loading("Initializing your creator profile...");
    try {
      const nameField = encodeStringAsField(name);
      const bioFields = `[${stringToFieldInputs(bio).join(", ")}]`;
      const params = {
        functionName: "create_creator_profile",
        inputs: [nameField, bioFields],
        fee: 100000,
        feePrivate: false,
      };

      const txId = await createTransaction(params, executeTransaction);
      toast.loading("Profile submitted! Waiting for confirmation...", {
        id: toastId,
      });
      await waitTransactionConfirmation(txId, null, transactionStatus);

      toast.success("Profile successfully created! Syncing...", {
        id: toastId,
      });

      // Invalidate all privtok queries to force a complete refresh
      await queryClient.invalidateQueries({ queryKey: ["privtok"] });

      // Wait a bit for the indexer to update the is_creator mapping
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Force refresh all state including isCreator query
      await updateState(true);

      toast.success("Profile synced! You can now create content.", {
        id: toastId,
      });
      return true;
    } catch (error) {
      console.error("Profile creation error:", error);
      toast.error(`Registration failed: ${error.message}`, { id: toastId });
      throw error;
    }
  };

  const sendMessage = async (recipient, content) => {
    const toastId = toast.loading(`Sending encrypted message...`);
    try {
      // Convert content to field array
      const textFields = `[${stringToFieldInputs(content).join(", ")}]`;

      const params = {
        functionName: "send_message",
        inputs: [recipient, textFields],
        fee: 100000,
        feePrivate: true,
      };

      const txId = await createTransaction(params, executeTransaction);
      toast.loading("Message submitted! Waiting for blocks...", {
        id: toastId,
      });
      await waitTransactionConfirmation(txId, null, transactionStatus);

      toast.success("Message sent successfully!", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["privtok"] });
    } catch (error) {
      console.error("Message error:", error);
      toast.error(`Failed to send message: ${error.message}`, { id: toastId });
    }
  };

  const subscribeToContent = async (post, tokenType = 0) => {
    const toastId = toast.loading(`Processing subscription...`);
    try {
      const postId = post.postId || post.id;
      const price = post.price.toString();
      const creator = post.creator;
      const offchainUrl = `[${stringToFieldInputs(post.metadata).join(", ")}]`;
      const nonce = `[${post.nonce.join(", ")}]`;

      let functionName =
        tokenType === 0 ? "subscribe_public_credits" : "subscribe_public_usdx";

      const params = {
        functionName,
        inputs: [
          postId,
          price + (tokenType === 0 ? "u64" : "u128"),
          creator,
          offchainUrl,
          nonce,
        ],
        fee: 200000,
        feePrivate: false,
      };

      const txId = await createTransaction(params, executeTransaction);
      toast.loading("Transaction submitted! Waiting for blocks...", {
        id: toastId,
      });
      await waitTransactionConfirmation(txId, null, transactionStatus);

      toast.success("Subscription successful!", { id: toastId });

      // Invalidate queries to trigger refresh
      queryClient.invalidateQueries({ queryKey: ["privtok"] });
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(`Subscription failed: ${error.message}`, { id: toastId });
    }
  };

  const issueSubscriptionPass = async (post, inviteeAddress) => {
    const toastId = toast.loading(`Issuing subscription pass...`);
    try {
      const postId = post.postId || post.id;
      const records = await requestRecords(PROGRAM_ID, true);
      const postTicket = records.find(
        (r) =>
          (r.recordName === "PostTicket" || r.name === "PostTicket") &&
          f(r.data?.post_id) === f(postId),
      );

      if (!postTicket)
        throw new Error("PostTicket not found. You must be the creator.");

      const params = {
        functionName: "issue_subscription_pass",
        inputs: [postTicket.plaintext, inviteeAddress],
        fee: 150000,
        feePrivate: true,
      };

      const txId = await createTransaction(params, executeTransaction);
      toast.loading("Pass issued! Waiting for confirmation...", {
        id: toastId,
      });
      await waitTransactionConfirmation(txId, null, transactionStatus);
      toast.success("Subscription pass sent!", { id: toastId });

      queryClient.invalidateQueries({ queryKey: ["privtok"] });
    } catch (error) {
      console.error("Pass issuance failed:", error);
      toast.error(`Issuance failed: ${error.message}`, { id: toastId });
      throw error;
    }
  };

  const hasAccessToContent = (postId) => {
    const cleanPostId = filterVisibility(postId);
    return (
      privTokState.subscriberAccess?.some(
        (access) => f(access.data.post_id) === cleanPostId,
      ) || false
    );
  };

  return (
    <PrivTokContext.Provider
      value={{
        privTokState,
        connected,
        publicKey,
        subscribeToContent,
        hasAccessToContent,
        issueSubscriptionPass,
        sendMessage,
        createProfile,
        updateState,
        setDashboardMode,
        // These are needed for backward compatibility or direct access
        isLoading: privTokState.isLoading,
        refetchPublic,
        refetchPrivate,
      }}
    >
      {children}
    </PrivTokContext.Provider>
  );
};
