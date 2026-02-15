import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Loader2, AlertCircle, CheckCircle2, RefreshCw, Layers } from 'lucide-react';

const ConvertCreditsModal = ({
    isOpen,
    onClose,
    onConvert,
    requiredAmount,
    publicBalance,
    privateBalance
}) => {
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Add small buffer for fees
    const amountToConvert = Math.ceil(requiredAmount + 0.1);
    const hasEnoughPublic = publicBalance >= amountToConvert;

    // Check if user has enough total private but fragmented
    const canConsolidate = privateBalance >= (requiredAmount + 1.0);

    const handleConvert = async () => {
        if (!hasEnoughPublic) {
            setError('Insufficient public balance');
            return;
        }

        setIsConverting(true);
        setError(null);

        try {
            await onConvert(amountToConvert);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setIsConverting(false);
            }, 2000);
        } catch (e) {
            setError(e.message || 'Conversion failed');
            setIsConverting(false);
        }
    };

    const handleConsolidate = async () => {
        setError(null);
        try {
            // TODO: Implement record consolidation
            console.log('Consolidation functionality coming soon');
            onClose();
        } catch (e) {
            setError(e.message || 'Consolidation failed');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass-card"
                        style={{
                            maxWidth: '500px',
                            width: '100%',
                            padding: '32px',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!isConverting && (
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                            >
                                <X size={20} />
                            </button>
                        )}

                        {success ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                >
                                    <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 16px' }} />
                                </motion.div>
                                <h2 style={{ marginBottom: '8px' }}>Conversion Successful!</h2>
                                <p style={{ color: 'var(--text-muted)' }}>
                                    Your credits have been converted to private
                                </p>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)' }}>
                                            <RefreshCw size={24} color="#3b82f6" />
                                        </div>
                                        <h2 style={{ margin: 0 }}>Convert Credits</h2>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                        Convert public credits to private to complete this transaction
                                    </p>
                                </div>

                                <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(255, 255, 255, 0.03)' }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                            Current Balances
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span>Public Balance</span>
                                            <span style={{ fontWeight: 600 }}>{publicBalance.toFixed(6)} ALEO</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Private Balance</span>
                                            <span style={{ fontWeight: 600 }}>{privateBalance.toFixed(6)} ALEO</span>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Required Amount</span>
                                            <span style={{ fontWeight: 600 }}>{requiredAmount.toFixed(6)} ALEO</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Conversion Amount (with buffer)</span>
                                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{amountToConvert.toFixed(6)} ALEO</span>
                                        </div>
                                    </div>
                                </div>

                                {canConsolidate && (
                                    <div
                                        className="glass-card"
                                        style={{
                                            padding: '16px',
                                            marginBottom: '24px',
                                            background: 'rgba(139, 92, 246, 0.05)',
                                            border: '1px solid rgba(139, 92, 246, 0.2)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                            <Layers size={20} color="var(--primary)" />
                                            <div style={{ fontWeight: 600 }}>Fragmented Balance?</div>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                            You have enough total private balance, but it might be split across multiple records.
                                        </p>
                                        <button
                                            onClick={handleConsolidate}
                                            disabled={isConverting}
                                            className="btn-secondary"
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Layers size={16} />
                                            Consolidate Private Records
                                        </button>
                                    </div>
                                )}

                                {!hasEnoughPublic && !canConsolidate && (
                                    <div
                                        className="glass-card"
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '24px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div>
                                                <div style={{ fontWeight: 600, marginBottom: '4px', color: '#ef4444' }}>Insufficient Total Balance</div>
                                                <div style={{ fontSize: '0.85rem', color: 'rgba(239, 68, 68, 0.9)' }}>
                                                    You need {amountToConvert.toFixed(6)} ALEO but have {(publicBalance + privateBalance).toFixed(6)} ALEO total.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div
                                        className="glass-card"
                                        style={{
                                            padding: '12px 16px',
                                            marginBottom: '24px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <div style={{ fontSize: '0.9rem', color: '#ef4444' }}>{error}</div>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={onClose}
                                        disabled={isConverting}
                                        className="btn-secondary"
                                        style={{ flex: 1, opacity: isConverting ? 0.5 : 1 }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConvert}
                                        disabled={isConverting || !hasEnoughPublic}
                                        className="btn-primary"
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            opacity: (isConverting || !hasEnoughPublic) ? 0.5 : 1
                                        }}
                                    >
                                        {isConverting ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Converting...
                                            </>
                                        ) : (
                                            <>
                                                Convert Credits
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConvertCreditsModal;