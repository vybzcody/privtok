import React from 'react';
import { Card, List, Typography, Button, Empty, Tag, Space, Alert, Divider } from 'antd';
import { usePrivTokState } from '../components/PrivTokState.jsx';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { createTransaction, waitTransactionConfirmation } from "../core/transaction.js";
import { motion } from 'framer-motion';
import { Gift, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { PROGRAM_ID } from "../core/constants.js";
import { generateRandomScalar, stringToFieldInputs } from "../core/encoder.js";
import { filterVisibility as f } from "../core/processing.js";

const { Title, Text } = Typography;

export const MyInvites = () => {
    const { privTokState, hasAccessToContent, updateState } = usePrivTokState();
    const { executeTransaction, transactionStatus, requestRecords } = useWallet();

    const passes = privTokState.activePasses || [];

    const handleAcceptPass = async (pass) => {
        const assetName = pass.tokenType === 0 ? "ALEO" : "USDX";
        const toastId = toast.loading(`Accepting ${assetName} subscription pass...`);

        try {
            const nonce = generateRandomScalar();
            const postId = pass.postId;
            const priceStr = pass.record.data.post ? f(JSON.parse(pass.record.data.post.replace(/'/g, '"')).price) : "0u128";

            // Note: In real Aleo, we'd need Merkle Proofs for private USDX. 
            // For this version, we focus on the Credits private flow and standard USDX public.

            let params;
            if (pass.tokenType === 0) {
                // ALEO Credits Private Subscription
                const creditsRecords = await requestRecords("credits.aleo", true);
                const paymentRecord = creditsRecords.find(r =>
                    BigInt(f(r.data.microcredits).replace('u64', '')) >= BigInt(priceStr.replace('u128', ''))
                );

                if (!paymentRecord) throw new Error("Insufficient private ALEO balance.");

                params = {
                    functionName: 'subscribe_private_credits',
                    inputs: [
                        paymentRecord.plaintext,
                        postId,
                        priceStr,
                        pass.creator,
                        pass.record.data.post ? f(JSON.parse(pass.record.data.post.replace(/'/g, '"')).offchain_url) : "[]",
                        pass.record.data.post ? f(JSON.parse(pass.record.data.post.replace(/'/g, '"')).nonce) : "[]"
                    ],
                    fee: 250000,
                    feePrivate: true
                };
            } else {
                // USDX Private Subscription (Simplified for now)
                toast.error("Private USDX subscriptions require Merkle Proofs. Please use Public Hub for USDX for now.");
                return;
            }

            const txId = await createTransaction(params, executeTransaction);
            toast.loading("Transaction submitted! Waiting for confirmation...", { id: toastId });
            await waitTransactionConfirmation(txId, null, transactionStatus);

            toast.success("Pass accepted! Content unlocked.", { id: toastId });
            await updateState(true);
        } catch (error) {
            console.error('Error accepting pass:', error);
            toast.error(`Failed to accept pass: ${error.message}`, { id: toastId });
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ marginBottom: '48px' }}>
                    <Title level={1}>Subscription <span className="gradient-text">Passes</span></Title>
                    <Text style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Private ZK-passes issued to you by creators
                    </Text>
                </div>

                {passes.length === 0 ? (
                    <Empty
                        description="No subscription passes found"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <List
                        grid={{ gutter: 24, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
                        dataSource={passes}
                        renderItem={pass => {
                            const hasAccess = hasAccessToContent(pass.postId);
                            const assetName = pass.tokenType === 0 ? "ALEO" : "USDX";

                            return (
                                <List.Item>
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className="glass-card">
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '16px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{
                                                        padding: '12px',
                                                        borderRadius: '12px',
                                                        background: 'rgba(139, 92, 246, 0.1)'
                                                    }}>
                                                        <Gift size={24} color="#8b5cf6" />
                                                    </div>
                                                    <div>
                                                        <Title level={4} style={{ margin: '0 0 4px 0' }}>
                                                            Private Content Pass
                                                        </Title>
                                                        <Text type="secondary">
                                                            From: {pass.creator.substring(0, 20)}...
                                                        </Text>
                                                    </div>
                                                </div>

                                                <Tag color="purple" style={{ fontSize: '12px' }}>
                                                    <Lock size={12} style={{ marginRight: '4px' }} />
                                                    ZK PASS
                                                </Tag>
                                            </div>

                                            {hasAccess ? (
                                                <Alert
                                                    message="Access Active"
                                                    description="You have successfully used this pass to unlock the content."
                                                    type="success"
                                                    showIcon
                                                    icon={<CheckCircle size={18} />}
                                                />
                                            ) : (
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '16px',
                                                    background: 'rgba(139, 92, 246, 0.05)',
                                                    borderRadius: '12px'
                                                }}>
                                                    <div>
                                                        <Text strong>Pass Price: </Text>
                                                        <Text style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                                            {(pass.price / 1000000).toFixed(2)} {assetName}
                                                        </Text>
                                                    </div>
                                                    <Button
                                                        type="primary"
                                                        onClick={() => handleAcceptPass(pass)}
                                                        icon={<CheckCircle size={16} />}
                                                        size="large"
                                                    >
                                                        REDEEM PASS
                                                    </Button>
                                                </div>
                                            )}
                                        </Card>
                                    </motion.div>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </motion.div>
        </div>
    );
};
