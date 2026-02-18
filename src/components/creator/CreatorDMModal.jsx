import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Shield, Lock, MessageCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { usePrivTokState } from '../PrivTokState.jsx';
import { toast } from 'sonner';

const CreatorDMModal = ({ isOpen, onClose, creatorId, creatorName }) => {
    const { connected } = useWallet();
    const { privTokState } = usePrivTokState();
    const [message, setMessage] = useState('');
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isMessageSending, setIsMessageSending] = useState(false);

    // Check if user is subscribed to this creator
    const isSubscribed = useMemo(() => {
        return Object.values(privTokState.subscriptions || {}).some(sub =>
            sub.creatorId === creatorId && sub.isActive
        );
    }, [privTokState.subscriptions, creatorId]);

    const handleSend = async () => {
        if (!message.trim()) return;
        if (!connected) {
            toast.error('Please connect your wallet first');
            return;
        }

        setIsMessageSending(true);
        try {
            // TODO: Implement actual message sending via Aleo
            toast.success('Message functionality coming soon!');
            setMessage('');
            onClose();
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setIsMessageSending(false);
        }
    };

    const handleSubscribe = async () => {
        setIsSubscribing(true);
        try {
            // TODO: Implement actual subscription via Aleo
            toast.success('Subscription functionality coming soon!');
        } catch (e) {
            toast.error('Failed to subscribe');
        } finally {
            setIsSubscribing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card"
                        style={{ width: '100%', maxWidth: '500px', padding: 0, overflow: 'hidden' }}
                    >
                        {/* Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(155, 81, 224, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageCircle size={20} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>Message {creatorName}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                                        <Shield size={12} />
                                        End-to-End Encrypted
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            {!isSubscribed ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <Lock size={32} color="var(--text-muted)" />
                                    </div>
                                    <h4 style={{ marginBottom: '8px' }}>Subscriber Exclusive</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                        You must be a subscriber to send direct messages to {creatorName}.
                                    </p>
                                    <button
                                        className="btn-primary"
                                        onClick={handleSubscribe}
                                        disabled={isSubscribing}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        {isSubscribing ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Subscribe to Unlock'
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <textarea
                                        placeholder={`Write a message to ${creatorName}...`}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        style={{
                                            width: '100%',
                                            minHeight: '150px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '12px',
                                            padding: '16px',
                                            color: 'white',
                                            outline: 'none',
                                            resize: 'none',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit'
                                        }}
                                    />

                                    <button
                                        onClick={handleSend}
                                        disabled={isMessageSending || !message.trim()}
                                        className="btn-primary"
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        {isMessageSending ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Encrypting & Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Send Secured Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer Accent */}
                        <div style={{ height: '4px', background: 'linear-gradient(to right, var(--primary), var(--accent))', opacity: 0.5 }} />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreatorDMModal;