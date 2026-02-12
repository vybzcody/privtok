import React, { useMemo } from 'react';
import { AleoWalletProvider as WalletProvider } from "@provablehq/aleo-wallet-adaptor-react";
import { AleoHooksProvider } from '@provablehq/aleo-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeoWalletAdapter } from "@provablehq/aleo-wallet-adaptor-leo";
import { PuzzleWalletAdapter } from "@provablehq/aleo-wallet-adaptor-puzzle";
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield";
import { FoxWalletAdapter } from "@provablehq/aleo-wallet-adaptor-fox";
import { SoterWalletAdapter } from "@provablehq/aleo-wallet-adaptor-soter";
import { DecryptPermission } from "@provablehq/aleo-wallet-adaptor-core";
import { WalletModalProvider } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { Network } from "@provablehq/aleo-types";
import { Toaster, toast } from "sonner";
import { PROGRAM_ID } from "../core/constants.js";

import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

export const WalletWrapper = ({ children }) => {
    const programs = useMemo(() => [PROGRAM_ID, 'credits.aleo'], []);

    const wallets = useMemo(
        () => [
            new ShieldWalletAdapter({
                appName: 'PrivTok v2'
            }),
            new LeoWalletAdapter({
                appName: 'PrivTok v2'
            }),
            new PuzzleWalletAdapter({
                appName: 'PrivTok v2'
            }),
            new FoxWalletAdapter({
                appName: 'PrivTok v2'
            }),
            new SoterWalletAdapter({
                appName: 'PrivTok v2'
            }),
        ],
        []
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AleoHooksProvider>
                <WalletProvider
                    wallets={wallets}
                    decryptPermission={DecryptPermission.AutoDecrypt}
                    network={Network.TESTNET}
                    programs={programs}
                    autoConnect={false}
                    onError={(error) => toast.error(error.message)}
                >
                    <WalletModalProvider>
                        {children}
                        <Toaster position="bottom-right" richColors />
                    </WalletModalProvider>
                </WalletProvider>
            </AleoHooksProvider>
        </QueryClientProvider>
    );
};
