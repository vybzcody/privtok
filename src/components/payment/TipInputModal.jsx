import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, AlertCircle, TrendingUp, Info, Wallet, Shield } from 'lucide-react';

const FEE_TIERS = {
    LOW: 0.1,
    MEDIUM: 0.2,
    HIGH: 0.5
};

const TipInputModal = ({
    isOpen,
    onClose,
    onConfirm,
    creatorName,
    publicBalance,
    privateBalance
}) => {
    const [amount, setAmount] = useState('1.0');
    const [feeTier, setFeeTier] = useState('MEDIUM');
    const [paymentType, setPaymentType] = useState('public');
    const [error, setError] = useState(null);

    const numAmount = parseFloat(amount) || 0;
    const feeInAleo = FEE_TIERS[feeTier];
    const total = numAmount + feeInAleo;

    const currentBalance = paymentType === 'public' ? publicBalance : privateBalance;
    const hasSufficientBalance = currentBalance >= total;

    const handleAmountChange = (val) => {
        // Only allow numbers and one decimal point
        if (/^\d*\.?\d*$/.test(val) || val === '') {
            setAmount(val);
        }
    };

    const handleConfirm = () => {
        if (numAmount <= 0) {
            setError('Please enter an amount greater than 0');
            return;
        }
        if (!hasSufficientBalance) {
            setError(`Insufficient ${paymentType} balance for this tip`);
            return;
        }
        onConfirm(numAmount, feeTier, paymentType);
    };

    const quickAmounts = [1, 5, 10, 50];

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        background: 'rgba(0,0,0,0.8)',
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
                        style={{ width: '100%', maxWidth: '440px', padding: '32px', position: 'relative' }}
                    >
                        <button
                            onClick={onClose}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Heart size={32} color="var(--primary)" fill="var(--primary)" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Tip {creatorName}</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Support this creator with ALEO credits</p>
                        </div>

                        {/* Payment Method Selection */}
                        <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', display: 'flex' }}>
                            <button
                                onClick={() => setPaymentType('public')}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: paymentType === 'public' ? 'var(--primary)' : 'transparent',
                                    color: paymentType === 'public' ? 'white' : 'var(--text-muted)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Wallet size={16} />
                                Public
                            </button>
                            <button
                                onClick={() => setPaymentType('private')}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: paymentType === 'private' ? 'var(--primary)' : 'transparent',
                                    color: paymentType === 'private' ? 'white' : 'var(--text-muted)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Shield size={16} />
                                Private
                            </button>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Amount to Tip</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    placeholder="0.0"
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        fontSize: '2.5rem',
                                        fontWeight: 700,
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '16px',
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: 'white',
                                        outline: 'none',
                                        marginBottom: '16px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--primary)', pointerEvents: 'none' }}>
                                    ALEO
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                {quickAmounts.map(a => (
                                    <button
                                        key={a}
                                        onClick={() => setAmount(a.toString())}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        +{a}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                <TrendingUp size={16} />
                                Network Priority (Fee)
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                {(['LOW', 'MEDIUM', 'HIGH']).map(tier => (
                                    <button
                                        key={tier}
                                        onClick={() => setFeeTier(tier)}
                                        style={{
                                            padding: '12px 8px',
                                            borderRadius: '12px',
                                            background: feeTier === tier ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                            border: '1px solid',
                                            borderColor: feeTier === tier ? 'var(--primary)' : 'var(--glass-border)',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {tier}
                                        <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 400 }}>
                                            {FEE_TIERS[tier].toFixed(2)} ALEO
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>You Pay Total ({paymentType === 'public' ? 'Public' : 'Private'})</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{total.toFixed(4)} ALEO</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Available Balance</span>
                                <span style={{ color: hasSufficientBalance ? '#10b981' : '#ef4444' }}>{currentBalance.toFixed(4)} ALEO</span>
                            </div>
                        </div>

                        {error && (
                            <div style={{ display: 'flex', gap: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', alignItems: 'flex-start' }}>
                                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleConfirm}
                            disabled={!hasSufficientBalance || numAmount <= 0}
                            className="btn-primary"
                            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 600 }}
                        >
                            Continue to Confirm
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Info size={12} />
                            Transactions on Aleo are private & secured
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TipInputModal;