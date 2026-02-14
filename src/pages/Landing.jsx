import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Lock, Zap, ArrowRight, Wallet, CheckCircle, DollarSign } from 'lucide-react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';

const Landing = () => {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* Hero Section */}
            <section style={{ 
                textAlign: 'center', 
                marginBottom: '80px', 
                paddingTop: '60px',
                maxWidth: '900px',
                margin: '0 auto 80px'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        background: 'rgba(255, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 0, 0, 0.2)',
                        color: 'var(--primary)',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '24px'
                    }}>
                        Empowering Creators on Aleo
                    </div>
                    
                    <h1 style={{ 
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
                        lineHeight: 1.1, 
                        marginBottom: '24px',
                        margin: '0 auto 24px'
                    }}>
                        Secure Content, <br />
                        <span className="gradient-text">Absolute Privacy</span>
                    </h1>
                    
                    <p style={{ 
                        fontSize: '1.25rem', 
                        color: 'var(--text-muted)', 
                        maxWidth: '650px', 
                        margin: '0 auto 40px', 
                        lineHeight: 1.6 
                    }}>
                        Create, share, and monetize content with true privacy. 
                        Powered by Aleo's zero-knowledge proofs for unmatched confidentiality 
                        with a premium creator experience.
                    </p>

                    <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        justifyContent: 'center', 
                        flexWrap: 'wrap' 
                    }}>
                        {connected ? (
                            <Link to="/hub">
                                <button 
                                    className="btn-primary" 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        padding: '14px 40px',
                                        margin: '0 auto'
                                    }}
                                >
                                    Enter Application <ArrowRight size={20} />
                                </button>
                            </Link>
                        ) : (
                            <button
                                className="btn-primary"
                                onClick={() => setVisible(true)}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px', 
                                    padding: '14px 40px',
                                    margin: '0 auto'
                                }}
                            >
                                <Wallet size={20} /> Get Started Now
                            </button>
                        )}
                    </div>
                </motion.div>
            </section>

            {/* How Privacy Works Section */}
            <section style={{ marginBottom: '100px', maxWidth: '1200px', margin: '0 auto 100px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '48px' }}>
                    How Privacy Works by Default
                </h2>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    position: 'relative'
                }}>
                    {[
                        {
                            step: "01",
                            title: "Local Encryption",
                            desc: "Your content is encrypted directly in your browser before it ever leaves your device.",
                            icon: <Lock size={24} />
                        },
                        {
                            step: "02",
                            title: "ZK Proof Generation",
                            desc: "Subscribers generate a local Zero-Knowledge proof confirming their access rights without revealing identity.",
                            icon: <Shield size={24} />
                        },
                        {
                            step: "03",
                            title: "Private Unlock",
                            desc: "The smart contract verifies the proof and grants access. Your data remains invisible to everyone else.",
                            icon: <CheckCircle size={24} />
                        }
                    ].map((item, index) => (
                        <motion.div
                            key={item.step}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="glass-card"
                            style={{ 
                                padding: '32px', 
                                position: 'relative',
                                borderRadius: '16px'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: '-15px',
                                right: '20px',
                                fontSize: '4rem',
                                fontWeight: '900',
                                color: 'rgba(255,255,255,0.03)',
                                pointerEvents: 'none'
                            }}>
                                {item.step}
                            </div>
                            
                            <div style={{
                                marginBottom: '20px',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                {item.icon}
                                <span style={{ fontWeight: '700', letterSpacing: '1px' }}>
                                    STEP {item.step}
                                </span>
                            </div>
                            
                            <h4 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>
                                {item.title}
                            </h4>
                            
                            <p style={{ 
                                color: 'var(--text-muted)', 
                                fontSize: '0.95rem', 
                                lineHeight: '1.5' 
                            }}>
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '32px', 
                marginBottom: '80px',
                maxWidth: '1200px',
                margin: '0 auto 80px'
            }}>
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card"
                    style={{ padding: '40px', borderRadius: '16px' }}
                >
                    <div style={{ 
                        marginBottom: '24px', 
                        display: 'inline-block', 
                        padding: '16px', 
                        background: 'rgba(255, 0, 0, 0.1)', 
                        borderRadius: '16px' 
                    }}>
                        <Lock color="var(--primary)" size={36} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
                        Zero-Knowledge Privacy
                    </h3>
                    <p style={{ 
                        color: 'var(--text-muted)', 
                        lineHeight: 1.6, 
                        fontSize: '1.05rem' 
                    }}>
                        Your data stays yours. Only intended recipients can decrypt and view 
                        your content, guaranteed by Aleo's private record model.
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card"
                    style={{ padding: '40px', borderRadius: '16px' }}
                >
                    <div style={{ 
                        marginBottom: '24px', 
                        display: 'inline-block', 
                        padding: '16px', 
                        background: 'rgba(255, 165, 0, 0.1)', 
                        borderRadius: '16px' 
                    }}>
                        <DollarSign color="#ffa500" size={36} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
                        Direct Creator Earnings
                    </h3>
                    <p style={{ 
                        color: 'var(--text-muted)', 
                        lineHeight: 1.6, 
                        fontSize: '1.05rem' 
                    }}>
                        Keep 100% of your earnings. No middlemen, no platform fees. 
                        Subscriptions and payments go directly to your wallet.
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card"
                    style={{ padding: '40px', borderRadius: '16px' }}
                >
                    <div style={{ 
                        marginBottom: '24px', 
                        display: 'inline-block', 
                        padding: '16px', 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        borderRadius: '16px' 
                    }}>
                        <Zap color="#3b82f6" size={36} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
                        Instant Access Control
                    </h3>
                    <p style={{ 
                        color: 'var(--text-muted)', 
                        lineHeight: 1.6, 
                        fontSize: '1.05rem' 
                    }}>
                        Grant or revoke access instantly. Manage subscribers, send private 
                        invites, and control who sees your content with one click.
                    </p>
                </motion.div>
            </div>

            {/* CTA Section */}
            <section style={{ 
                textAlign: 'center', 
                padding: '60px 40px',
                background: 'linear-gradient(135deg, rgba(255,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(255,0,0,0.2)',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                    Ready to Start Creating?
                </h2>
                <p style={{ 
                    fontSize: '1.125rem', 
                    color: 'var(--text-muted)', 
                    marginBottom: '32px' 
                }}>
                    Join the privacy-first creator economy on Aleo
                </p>
                
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    {connected ? (
                        <>
                            <Link to="/studio">
                                <button className="btn-primary" style={{ padding: '14px 32px' }}>
                                    Creator Studio
                                </button>
                            </Link>
                            <Link to="/hub">
                                <button className="btn-secondary" style={{ padding: '14px 32px' }}>
                                    Browse Hub
                                </button>
                            </Link>
                        </>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={() => setVisible(true)}
                            style={{ padding: '14px 40px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Wallet size={20} /> Connect Wallet to Start
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Landing;
