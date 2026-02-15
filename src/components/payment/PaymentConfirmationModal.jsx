import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PaymentConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    recipient,
    recipientName,
    amount,
    type = 'payment',
    userBalance = 0,
    feeTier = 'MEDIUM',
    isProcessing = false
}) => {
    const fee = 1.0; // Standard Aleo fee
    const total = amount + fee;

    const handleConfirm = async () => {
        if (userBalance < total) {
            toast.error(`Insufficient balance. You need ${total} ALEO but have ${userBalance.toFixed(6)} ALEO.`);
            return;
        }

        try {
            await onConfirm();
        } catch (error) {
            toast.error(`${type} failed: ${error.message}`);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2000,
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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass-card"
                        style={{ width: '100%', maxWidth: '450px', padding: '32px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <DollarSign size={24} color="var(--primary)" />
                                Confirm {type === 'subscription' ? 'Subscription' : type === 'tip' ? 'Tip' : 'Payment'}
                            </h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    {type === 'subscription' ? 'Subscribing to:' : type === 'tip' ? 'Sending tip to:' : 'Paying to:'}
                                </div>
                                <div style={{ fontWeight: 600 }}>{recipientName}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>
                                    {recipient?.substring(0, 12)}...{recipient?.substring(recipient.length - 8)}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Amount:</span>
                                <span style={{ fontWeight: 600 }}>{amount} ALEO</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Network Fee:</span>
                                <span>{fee} ALEO</span>
                            </div>
                            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '12px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
                                <span>Total:</span>
                                <span style={{ color: 'var(--primary)' }}>{total} ALEO</span>
                            </div>

                            {userBalance < total && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: '#ef4444'
                                }}>
                                    <AlertCircle size={16} />
                                    <span style={{ fontSize: '0.9rem' }}>
                                        Insufficient balance. You have {userBalance.toFixed(6)} ALEO.
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={onClose}
                                className="btn-secondary"
                                style={{ flex: 1, padding: '14px' }}
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                                disabled={isProcessing || userBalance < total}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Confirm ${type === 'subscription' ? 'Subscription' : type === 'tip' ? 'Tip' : 'Payment'}`
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PaymentConfirmationModal;