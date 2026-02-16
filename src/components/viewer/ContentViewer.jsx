import React, { useState, useEffect } from 'react';
import { Modal, Typography, Spin, Alert, Button } from 'antd';
import { usePrivTokState } from '../PrivTokState';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { VideoViewer, AudioViewer, ImageViewer, DocumentViewer } from './MediaViewers';
import { Lock, X, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { PROGRAM_ID } from '../../core/constants';
import { filterVisibility } from '../../core/processing';
import { fieldsToString } from '../../core/encoder';
import { AleoEncryption } from '../../services/aleoEncryption.js';

const { Title } = Typography;

export const ContentViewer = () => {
    const { requestRecords, wallet, signMessage } = useWallet();
    const [viewingContent, setViewingContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [decryptedUrl, setDecryptedUrl] = useState(null);

    // Listen for view content requests from other components
    useEffect(() => {
        window.__PRIVTOK_VIEW_CONTENT__ = handleViewContent;
        return () => { delete window.__PRIVTOK_VIEW_CONTENT__; };
    }, []);
    
    const handleViewContent = async (post) => {
        setLoading(true);
        setError(null);

        try {
            // 1. VERIFY ACCESS & GET RECORD
            const cleanPostId = filterVisibility(post.id || post.postId);
            const records = await requestRecords(PROGRAM_ID, true);
            
            // Find the ContentAccess record for this post
            const contentAccess = records.find(r => {
                const recordPostId = filterVisibility(r.data?.post_id || r.post_id || "");
                return (r.recordName === "ContentAccess" || r.name === "ContentAccess") &&
                    recordPostId === cleanPostId;
            });
            
            if (!contentAccess) {
                throw new Error('Access record not found. Please subscribe first.');
            }

            // 2. EXTRACT ENCRYPTION METADATA FROM PRIVATE RECORD
            // The record now contains 'post' which has 'offchain_url' and 'nonce'
            const recordData = contentAccess.data || contentAccess;
            const postInfo = recordData.post;
            
            if (!postInfo || !postInfo.offchain_url || !postInfo.nonce) {
                throw new Error('Private record is missing encryption metadata.');
            }

            // Extract CID
            const cidFields = postInfo.offchain_url.replace(/[\[\]]/g, '').split(',').map(f => f.trim());
            const ipfsCid = fieldsToString(cidFields.map(f => BigInt(filterVisibility(f))));
            
            // Extract Nonce
            const nonceFields = postInfo.nonce.replace(/[\[\]]/g, '').split(',').map(f => f.trim());
            const nonce = AleoEncryption.fieldsToNonce(nonceFields[0], nonceFields[1]);

            // 3. DERIVE DECRYPTION KEY
            toast.loading("Deriving decryption keys from your wallet...");
            const message = "Authorize PrivTok to encrypt/decrypt your private content.";
            const signature = await signMessage(message);
            
            if (!signature) {
                throw new Error("Decryption cancelled.");
            }

            // 4. DOWNLOAD & DECRYPT
            toast.loading("Downloading and decrypting content...");
            const gatewayUrl = `https://w3s.link/ipfs/${ipfsCid}`;
            const response = await fetch(gatewayUrl);
            if (!response.ok) throw new Error("Failed to download from IPFS");
            
            const encryptedData = await response.arrayBuffer();
            const decryptedData = await AleoEncryption.decryptData(encryptedData, nonce, signature);

            // 5. RENDER
            const url = URL.createObjectURL(new Blob([decryptedData], { 
                type: detectMediaType(ipfsCid) === 'video' ? 'video/mp4' : 'application/octet-stream' 
            }));
            
            setDecryptedUrl(url);
            setViewingContent({
                ...post,
                url,
                type: detectMediaType(ipfsCid)
            });
            
            toast.success('Content securely decrypted and unlocked!');
        } catch (err) {
            console.error('Decryption error:', err);
            setError(err.message);
            toast.error(`Failed to unlock: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const detectMediaType = (url) => {
        if (url.match(/\.(mp4|webm|ogg)$/i)) return 'video';
        if (url.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
        if (url.match(/\.(pdf|doc|txt|md)$/i)) return 'document';
        return 'video'; // Default
    };

    const renderViewer = () => {
        if (loading) {
            return (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '20px', fontSize: '16px' }}>
                        Loading content...
                    </div>
                </div>
            );
        }
        
        if (error) {
            return (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <Lock size={32} color="#ef4444" />
                    </div>
                    <h3 style={{ marginBottom: '12px' }}>Failed to Load Content</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                        {error}
                    </p>
                    <Button
                        type="primary"
                        onClick={() => {
                            setViewingContent(null);
                            setError(null);
                        }}
                    >
                        Close
                    </Button>
                </div>
            );
        }
        
        if (!viewingContent) return null;
        
        switch (viewingContent.type) {
            case 'video':
                return <VideoViewer src={decryptedUrl} title={viewingContent.title} />;
            case 'audio':
                return <AudioViewer src={decryptedUrl} title={viewingContent.title} />;
            case 'image':
                return <ImageViewer src={decryptedUrl} title={viewingContent.title} />;
            case 'document':
                return <DocumentViewer src={decryptedUrl} title={viewingContent.title} />;
            default:
                return <VideoViewer src={decryptedUrl} title={viewingContent.title} />;
        }
    };

    return (
        <Modal
            open={!!viewingContent}
            onCancel={() => {
                setViewingContent(null);
                setDecryptedUrl(null);
                setError(null);
            }}
            footer={null}
            width="90%"
            centered
            closeIcon={<X size={20} />}
        >
            {renderViewer()}
        </Modal>
    );
};
