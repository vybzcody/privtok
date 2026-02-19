import React, { useState, useEffect } from 'react';
import { Modal, Typography, Button, Steps, Space, Card, ConfigProvider, theme, Row, Col, Form, Input } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    Lock,
    Upload,
    Play,
    DollarSign,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Shield,
    Zap,
    Users,
    User
} from 'lucide-react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { usePrivTokState } from './PrivTokState.jsx';
import { encodeStringAsField, stringToFieldInputs } from "../core/encoder.js";
import { createTransaction, waitTransactionConfirmation } from "../core/transaction.js";

const { Title, Text } = Typography;

const ONBOARDING_STORAGE_KEY = 'privtok_onboarding_completed';

export const OnboardingModal = ({ onComplete }) => {
    const { connected } = useWallet();
    const { setVisible: setWalletModalVisible } = useWalletModal();
    const { privTokState = {}, createProfile } = usePrivTokState();
    const hasProfile = privTokState?.hasProfile;
    
    const [currentStep, setCurrentStep] = useState(0);
    const [isCompleted, setIsCompleted] = useState(() => localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileForm] = Form.useForm();

    const handleNext = () => {
        if (currentStep === steps.length - 1) {
            // Complete onboarding
            localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
            setIsCompleted(true);
            onComplete?.();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const steps = [
        {
            title: 'Welcome',
            description: 'A privacy-first content platform on Aleo',
            icon: <Shield size={48} color="var(--primary)" />,
            content: (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <Title level={3} className="gradient-text" style={{ marginBottom: '12px' }}>
                        Secure Content, Absolute Privacy
                    </Title>
                    <Text style={{ fontSize: '15px', color: 'var(--text-muted)', display: 'block', marginBottom: '20px' }}>
                        Create, share, and monetize content with true privacy using zero-knowledge proofs.
                    </Text>

                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card className="glass-card compact-card" style={{ height: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Lock size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                                <Text strong style={{ display: 'block', fontSize: '13px' }}>Private by Default</Text>
                                <Text type="secondary" style={{ fontSize: '11px' }}>Encrypted data</Text>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card className="glass-card compact-card" style={{ height: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <DollarSign size={20} color="#10b981" style={{ marginBottom: '8px' }} />
                                <Text strong style={{ display: 'block', fontSize: '13px' }}>Direct Earnings</Text>
                                <Text type="secondary" style={{ fontSize: '11px' }}>100% revenue</Text>
                            </Card>
                        </Col>
                        <Col span={24}>
                            <Card className="glass-card compact-card" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Space>
                                    <Users size={20} color="#3b82f6" />
                                    <div style={{ textAlign: 'left' }}>
                                        <Text strong style={{ display: 'block', fontSize: '13px' }}>Creator Control</Text>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>You own your audience and content</Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )
        },
        {
            title: 'Connect',
            description: 'Get started with your Aleo wallet',
            icon: <Wallet size={48} color="var(--primary)" />,
            content: (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <Title level={3} className="gradient-text" style={{ marginBottom: '12px' }}>
                        Connect Your Aleo Wallet
                    </Title>
                    <Text style={{ fontSize: '15px', color: 'var(--text-muted)', display: 'block', marginBottom: '24px' }}>
                        {connected
                            ? 'Wallet connected successfully!'
                            : 'Choose from supported wallets to get started'}
                    </Text>

                    {connected ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                        >
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <CheckCircle size={36} color="#10b981" />
                            </div>
                            <Text strong style={{ color: '#10b981', fontSize: '16px' }}>Wallet Connected</Text>
                        </motion.div>
                    ) : (
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => setWalletModalVisible(true)}
                            icon={<Wallet size={20} />}
                            className="btn-primary"
                            style={{ padding: '0 40px', height: '48px', marginBottom: '16px' }}
                        >
                            Connect Wallet
                        </Button>
                    )}

                    <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            Supported: Puzzle, Leo, Shield, Fox, Soter
                        </Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Profile',
            description: 'Create your ZK identity',
            icon: <User size={48} color="var(--primary)" />,
            content: (
                <div style={{ padding: '10px 0' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <Title level={3} className="gradient-text" style={{ marginBottom: '8px' }}>
                            Creator Identity
                        </Title>
                        <Text style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            Register your ZK profile to start publishing content.
                        </Text>
                    </div>

                    <Form form={profileForm} layout="vertical" onFinish={(v) => handleCreateProfileLocal(v)} requiredMark={false}>
                        <Form.Item name="name" label={<Text strong>Display Name</Text>} rules={[{ required: true }]}>
                            <Input placeholder="Your Stage Name" className="glass-input" />
                        </Form.Item>
                        <Form.Item name="bio" label={<Text strong>Bio</Text>} rules={[{ required: true }]}>
                            <Input.TextArea rows={3} placeholder="What do you create?" className="glass-input" />
                        </Form.Item>
                        <Button 
                            className="btn-primary" 
                            htmlType="submit" 
                            loading={profileLoading} 
                            block 
                            style={{ height: '45px', marginTop: '10px' }}
                        >
                            REGISTER IDENTITY
                        </Button>
                    </Form>
                    
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Button type="link" onClick={handleNext} style={{ color: 'var(--text-muted)' }}>
                            Skip for now, I'm just a viewer
                        </Button>
                    </div>
                </div>
            )
        },
        {
            title: 'Discover',
            description: 'Discover exclusive content from creators',
            icon: <Play size={48} color="var(--primary)" />,
            content: (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <Title level={3} className="gradient-text" style={{ marginBottom: '12px' }}>
                        Browse & Subscribe
                    </Title>
                    <Text style={{ fontSize: '15px', color: 'var(--text-muted)', display: 'block', marginBottom: '20px' }}>
                        Discover exclusive content and subscribe with one-time payments
                    </Text>

                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card className="glass-card compact-card" style={{ height: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Play size={20} color="var(--primary)" style={{ marginBottom: '8px' }} />
                                <Text strong style={{ display: 'block', fontSize: '13px' }}>One-Time Payment</Text>
                                <Text type="secondary" style={{ fontSize: '11px' }}>Pay once, access forever</Text>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card className="glass-card compact-card" style={{ height: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Lock size={20} color="#3b82f6" style={{ marginBottom: '8px' }} />
                                <Text strong style={{ display: 'block', fontSize: '13px' }}>Private Access</Text>
                                <Text type="secondary" style={{ fontSize: '11px' }}>Subscriptions are private</Text>
                            </Card>
                        </Col>
                        <Col span={24}>
                            <Card className="glass-card compact-card" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Space>
                                    <Upload size={20} color="#10b981" />
                                    <div style={{ textAlign: 'left' }}>
                                        <Text strong style={{ display: 'block', fontSize: '13px' }}>Creator Studio</Text>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>Share your own content and earn rewards</Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )
        },
        {
            title: 'Ready',
            description: 'Start exploring PrivTok',
            icon: <Zap size={48} color="var(--primary)" />,
            content: (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,0,0,0.2) 0%, rgba(255,77,79,0.2) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <Zap size={40} color="var(--primary)" />
                        </div>
                    </motion.div>

                    <Title level={3} style={{ marginBottom: '12px' }}>
                        You're All Set! 🎉
                    </Title>
                    <Text style={{ fontSize: '15px', color: 'var(--text-muted)', display: 'block', marginBottom: '24px' }}>
                        Ready to explore the future of private content
                    </Text>

                    <div style={{
                        padding: '16px',
                        marginBottom: '20px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px'
                    }}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: '13px' }}>✅ Wallet Connected</Text>
                                <CheckCircle size={14} color="#10b981" />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: '13px' }}>{hasProfile ? '✅' : '⏳'} Profile Indexed</Text>
                                <CheckCircle size={14} color={hasProfile ? "#10b981" : "#666"} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: '13px' }}>🚀 Ready to Explore</Text>
                                <ArrowRight size={14} color="var(--primary)" />
                            </div>
                        </Space>
                    </div>
                </div>
            )
        }
    ];

    // Check if user has completed onboarding before OR has a profile
    useEffect(() => {
        const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
        
        if (hasProfile) {
            localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
            // If they have a profile AND have completed onboarding (or it's a refresh), don't show it
            if (completed) {
                setIsCompleted(true);
            } else if (currentStep < 2) {
                // If they have a profile but haven't "completed" and are at the start, 
                // skip to completion step (Requirement 2 AC 2)
                setCurrentStep(steps.length - 1);
            }
            return;
        }

        if (completed) {
            setIsCompleted(true);
            onComplete?.();
        }
    }, [hasProfile, currentStep]); 

    // Don't show if already completed
    if (isCompleted) return null;

    const handleCreateProfileLocal = async (values) => {
        try {
            setProfileLoading(true);
            await createProfile(values.name, values.bio);
            // On success, the useEffect will trigger and move to the last step
        } catch (error) {
            // Error handled by createProfile toast
        } finally {
            setProfileLoading(false);
        }
    };

    const canProceed = () => {
        // On step 1 (wallet connect), require wallet connection
        if (currentStep === 1 && !connected) {
            return false;
        }
        // On step 2 (profile creation), don't require it if they click next (skip)
        // But the next button is hidden in my implementation above for the form step
        // to encourage registration or explicit skip
        if (currentStep === 2 && !hasProfile) {
            return false; // Force using the form or the explicit skip link
        }
        return true;
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: "#FF0000",
                    fontFamily: "'Space Grotesk', sans-serif",
                },
            }}
        >
            <Modal
                open={!isCompleted}
                footer={null}
                centered
                closable={currentStep === steps.length - 1 || hasProfile} // Allow close if on last step or already has profile
                width={600}
                maskClosable={false}
            >
                <div style={{ padding: '24px 0' }}>
                    {/* Progress Steps */}
                    <Steps
                        current={currentStep}
                        items={steps.map((s, i) => ({
                            title: s.title,
                            icon: React.cloneElement(s.icon, { size: 20 })
                        }))}
                        size="small"
                        style={{ marginBottom: '32px' }}
                    />

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {steps[currentStep].content}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '32px',
                        paddingTop: '24px',
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <Button
                            onClick={handlePrev}
                            disabled={currentStep === 0 || profileLoading}
                            icon={<ArrowLeft size={16} />}
                        >
                            Back
                        </Button>

                        <Button
                            type="primary"
                            onClick={handleNext}
                            disabled={!canProceed() || profileLoading}
                            icon={currentStep === steps.length - 1 ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
                            size="large"
                        >
                            {currentStep === steps.length - 1 ? "Let's Go!" : "Next"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </ConfigProvider>
    );
};

export default OnboardingModal;
