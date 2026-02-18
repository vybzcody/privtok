import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { Send, Inbox, User, Clock, Shield, MessageSquare, X, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivTokState } from '../components/PrivTokState';
import { fieldsToString } from '../core/encoder';
import { filterVisibility } from '../core/processing';

/**
 * Messages page - Direct messaging view for creators and subscribers
 * Displays encrypted messages sent via the Aleo network
 */
const Messages = () => {
    const { connected, address } = useWallet();
    const { privTokState, sendMessage, isLoading } = usePrivTokState();

    const [recipientAddress, setRecipientAddress] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedContact, setSelectedContact] = useState(null);
    const [isSending, setIsSending] = useState(false);

    // Decrypt and process messages from state
    const processedMessages = useMemo(() => {
        if (!privTokState.messages) return [];
        
        return privTokState.messages.map(msg => {
            let decryptedText = "Encryption restricted";
            try {
                // msg.text is usually a string like "[123field, 456field, ...]"
                if (typeof msg.text === 'string' && msg.text.startsWith('[')) {
                    const fieldArray = msg.text
                        .replace(/[\[\]]/g, '')
                        .split(',')
                        .map(f => BigInt(filterVisibility(f.trim())));
                    
                    decryptedText = fieldsToString(fieldArray);
                }
            } catch (e) {
                console.warn("Failed to decrypt message:", msg.id);
            }

            return {
                ...msg,
                decryptedText
            };
        }).sort((a, b) => b.timestamp - a.timestamp);
    }, [privTokState.messages]);

    const contacts = useMemo(() => {
        const uniqueContacts = new Set();
        processedMessages.forEach(msg => {
            if (msg.sender !== address) uniqueContacts.add(msg.sender);
            if (msg.recipient !== address) uniqueContacts.add(msg.recipient);
        });
        return Array.from(uniqueContacts).map(addr => ({
            address: addr,
            name: addr.substring(0, 8) + '...'
        }));
    }, [processedMessages, address]);

    const filteredMessages = useMemo(() => {
        let msgs = processedMessages;
        if (selectedContact) {
            msgs = msgs.filter(m => m.sender === selectedContact || m.recipient === selectedContact);
        }
        if (filter === 'sent') return msgs.filter(m => m.sender === address);
        if (filter === 'received') return msgs.filter(m => m.recipient === address);
        return msgs;
    }, [processedMessages, filter, address, selectedContact]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        // Basic Aleo address validation
        if (!/^aleo1[a-z0-9]{58}$/.test(recipientAddress)) {
            toast.error('Invalid Aleo recipient address');
            return;
        }

        if (!messageContent.trim()) {
            toast.error('Please enter a message');
            return;
        }

        setIsSending(true);
        try {
            await sendMessage(recipientAddress, messageContent);
            setMessageContent('');
            // If it was a new recipient, we don't have their message yet, but state will refresh
        } catch (error) {
            console.error('[MESSAGES] Send failed:', error);
        } finally {
            setIsSending(false);
        }
    };

    if (!connected) {
        return (
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60vh',
                        textAlign: 'center'
                    }}
                >
                    <div style={{
                        padding: '24px',
                        background: 'rgba(255, 0, 0, 0.1)',
                        borderRadius: '20px',
                        marginBottom: '24px'
                    }}>
                        <Shield size={64} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Connect Wallet</h2>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '500px', lineHeight: 1.6 }}>
                        Connect your Aleo wallet to view and send encrypted messages on the blockchain
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '40px' }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '32px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{
                        padding: '12px',
                        background: 'rgba(255, 0, 0, 0.1)',
                        borderRadius: '16px'
                    }}>
                        <MessageSquare size={32} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '2.5rem' }}>
                            Messages <span className="gradient-text">Encrypted</span>
                        </h2>
                        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Private peer-to-peer communication on Aleo
                        </p>
                    </div>
                </div>
            </motion.div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '350px 1fr',
                gap: '24px',
                alignItems: 'start'
            }}>
                {/* Sidebar - Contacts & Compose */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Compose Message Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card"
                    >
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Send size={18} style={{ color: 'var(--primary)' }} />
                            New Message
                        </h3>

                        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Recipient Address
                                </label>
                                <input
                                    type="text"
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                    placeholder="aleo1..."
                                    className="glass-input"
                                    required
                                    style={{ width: '100%', padding: '12px', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    Message
                                </label>
                                <textarea
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder="Your secret message..."
                                    className="glass-input"
                                    required
                                    style={{ width: '100%', padding: '12px', minHeight: '80px', fontSize: '0.9rem' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSending || !recipientAddress || !messageContent.trim()}
                                className={isSending ? "btn-secondary" : "btn-primary"}
                                style={{ width: '100%', height: '45px' }}
                            >
                                {isSending ? <Clock size={18} className="animate-spin" /> : "Send Private Message"}
                            </button>
                        </form>
                    </motion.div>

                    {/* Contacts List */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card"
                        style={{ padding: '0' }}
                    >
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={18} />
                                Conversations
                            </h3>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {contacts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No conversations yet</p>
                                </div>
                            ) : (
                                contacts.map(contact => (
                                    <button
                                        key={contact.address}
                                        onClick={() => setSelectedContact(contact.address === selectedContact ? null : contact.address)}
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: selectedContact === contact.address ? 'rgba(255,255,255,0.05)' : 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                {contact.address.substring(5, 7).toUpperCase()}
                                            </div>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>{contact.name}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{contact.address.substring(0, 12)}...</div>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color={selectedContact === contact.address ? 'var(--primary)' : '#444'} />
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Main Messages Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="glass-card"
                    style={{ padding: 0, overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' }}
                >
                    {/* Header/Filters */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            {['all', 'sent', 'received'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    style={{
                                        padding: '16px 0',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: filter === f ? '2px solid var(--primary)' : '2px solid transparent',
                                        color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        {selectedContact && (
                            <Tag 
                                closable 
                                onClose={() => setSelectedContact(null)}
                                style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid var(--primary)', color: 'white' }}
                            >
                                Chat: {selectedContact.substring(0, 8)}...
                            </Tag>
                        )}
                    </div>

                    {/* Messages List */}
                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '100px' }}>
                                <Clock size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 16px' }} />
                                <p>Syncing encrypted messages...</p>
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
                                <Inbox size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                <p>No messages found in this view</p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => {
                                const isSent = msg.sender === address;
                                return (
                                    <div 
                                        key={msg.id}
                                        style={{
                                            alignSelf: isSent ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: isSent ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div style={{ 
                                            padding: '12px 16px',
                                            borderRadius: isSent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            background: isSent ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            fontSize: '0.95rem',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                        }}>
                                            {msg.decryptedText}
                                        </div>
                                        <div style={{ 
                                            marginTop: '4px', 
                                            fontSize: '0.7rem', 
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {isSent ? 'Sent to ' + msg.recipient.substring(0, 8) : 'From ' + msg.sender.substring(0, 8)}
                                            <span>•</span>
                                            <Shield size={10} />
                                            ZK Secure
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Messages;
