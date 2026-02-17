import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Typography, Button, Space, Tag, Avatar, Statistic, Row, Col, Divider, Empty, Spin } from 'antd';
import { usePrivTokState } from '../components/PrivTokState';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { convertFieldToString } from "../core/encoder.js";
import { motion } from 'framer-motion';
import {
    User,
    CheckCircle,
    Lock,
    Unlock,
    Play,
    DollarSign,
    Users,
    FileText,
    ArrowLeft,
    MessageSquare,
    Globe,
    Search
} from 'lucide-react';
import { toast } from "sonner";
import { checkIsCreator, getCreatorPostCount } from "../services/aleoService";
import CreatorDMModal from '../components/creator/CreatorDMModal.jsx';

const { Title, Text } = Typography;

export const CreatorProfile = () => {
    const { creatorId } = useParams();
    const { privTokState, hasAccessToContent, subscribeToContent } = usePrivTokState();
    const { publicKey, connected } = useWallet();
    const [loading, setLoading] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [stats, setStats] = useState({ posts: 0, subs: 0 });
    const [isDMOpen, setIsDMOpen] = useState(false);

    // Fetch creator data from network discovery
    useEffect(() => {
        const fetchCreatorData = async () => {
            if (!creatorId) return;
            setLoading(true);
            try {
                const isCreatorResult = await checkIsCreator(creatorId);
                setIsCreator(isCreatorResult);

                const count = await getCreatorPostCount(creatorId);
                setStats(prev => ({ ...prev, posts: count }));
            } catch (error) {
                console.error("Error fetching creator data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCreatorData();
    }, [creatorId]);

    // Filter creator's posts
    const creatorPosts = useMemo(() => {
        return Object.values(privTokState.posts).filter(
            p => p.creator === creatorId
        );
    }, [privTokState.posts, creatorId]);

    // Calculate display stats
    const totalSubscribers = creatorPosts.reduce((sum, post) => sum + (post.subscriptionCount || 0), 0);
    const totalRevenue = creatorPosts.reduce((sum, post) => sum + ((post.subscriptionCount || 0) * (post.price || 0)), 0);

    const isOwnProfile = publicKey === creatorId;

    const handleSubscribe = async (post) => {
        if (!connected) {
            toast.error('Please connect your wallet');
            return;
        }
        setSubscribing(true);
        try {
            await subscribeToContent(post, post.tokenType || 0);
        } finally {
            setSubscribing(false);
        }
    };

    const handleViewContent = (post) => {
        if (!hasAccessToContent(post.postId)) {
            toast.error("Please subscribe to view this content");
            return;
        }
        window.__PRIVTOK_VIEW_CONTENT__?.(post);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '16px' }}>
                <Spin size="large" />
                <div style={{ color: 'var(--text-muted)' }}>Loading creator profile...</div>
            </div>
        );
    }

    const creatorName = creatorPosts.length > 0 && creatorPosts[0].name
        ? convertFieldToString(creatorPosts[0].name)
        : creatorId?.substring(0, 15) + '...';

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/hub">
                <Button
                    icon={<ArrowLeft size={16} />}
                    style={{ marginBottom: '24px', background: 'transparent', border: '1px solid #333', color: '#666' }}
                >
                    Back to Hub
                </Button>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="glass-card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
                    <div style={{
                        height: '200px',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #333 50%, #1a1a1a 100%)',
                        position: 'relative',
                        marginBottom: '80px'
                    }}>
                        <div style={{
                            position: 'absolute',
                            bottom: '-60px',
                            left: '40px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: '20px'
                        }}>
                            <Avatar
                                size={120}
                                icon={<User size={60} />}
                                style={{
                                    background: 'var(--primary)',
                                    border: '4px solid #1C1C1C',
                                    borderRadius: '50%'
                                }}
                            />
                            <div style={{ paddingBottom: '12px' }}>
                                <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {creatorName}
                                    {(isOwnProfile || isCreator) && <CheckCircle size={20} color="var(--primary)" />}
                                </Title>
                                <Text style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'monospace' }}>
                                    {creatorId}
                                </Text>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', padding: '0 24px 24px' }}>
                        {!isOwnProfile && (
                            <>
                                <Button icon={<MessageSquare size={16} />} onClick={() => setIsDMOpen(true)}>
                                    Message
                                </Button>
                                <Button icon={<DollarSign size={16} />} onClick={() => toast.info("Tipping coming soon!")}>
                                    Tip
                                </Button>
                            </>
                        )}
                    </div>
                </Card>

                <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                    <Col xs={24} sm={8}>
                        <Card className="glass-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)' }}>
                                    <FileText size={24} color="#3b82f6" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>POSTS</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.posts}</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="glass-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <Users size={24} color="#10b981" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>SUBSCRIBERS</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalSubscribers}</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="glass-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255, 0, 0, 0.1)' }}>
                                    <DollarSign size={24} color="var(--primary)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>EST. REVENUE</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {(totalRevenue / 1000000).toFixed(2)} ALEO
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                <Title level={3} style={{ marginBottom: '24px' }}>
                    <Play size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Content Library
                </Title>

                {creatorPosts.length === 0 ? (
                    <Empty
                        description="No public content found for this creator"
                        style={{ padding: '60px 0' }}
                        image={<Search size={64} color="#333" />}
                    />
                ) : (
                    <Row gutter={[24, 24]}>
                        {creatorPosts.map((post, index) => {
                            const postId = post.id || post.postId;
                            const unlocked = hasAccessToContent(postId);
                            const postName = post.name ? convertFieldToString(post.name) : `Post ${post.postId || index}`;

                            return (
                                <Col xs={24} sm={12} lg={8} key={postId}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card
                                            className="glass-card"
                                            cover={
                                                <div style={{
                                                    height: '180px',
                                                    background: unlocked
                                                        ? 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)'
                                                        : 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative'
                                                }}>
                                                    {unlocked ? (
                                                        <Play size={48} color="var(--primary)" />
                                                    ) : (
                                                        <Lock size={48} color="#444" />
                                                    )}
                                                </div>
                                            }
                                        >
                                            <Title level={5} style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
                                                {postName}
                                            </Title>
                                            <Row justify="space-between" align="middle">
                                                <Col>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PRICE</div>
                                                    <Text strong style={{ fontSize: '16px', color: 'var(--primary)' }}>
                                                        {(post.price / 1000000).toFixed(2)} {post.tokenType === 1 ? 'USDX' : 'ALEO'}
                                                    </Text>
                                                </Col>
                                                <Col>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        onClick={() => unlocked ? handleViewContent(post) : handleSubscribe(post)}
                                                        loading={subscribing}
                                                    >
                                                        {unlocked ? 'VIEW' : 'BUY'}
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </Card>
                                    </motion.div>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </motion.div>

            {/* Modals */}
            {isDMOpen && (
                <CreatorDMModal
                    isOpen={isDMOpen}
                    onClose={() => setIsDMOpen(false)}
                    creatorId={creatorId}
                    creatorName={creatorName}
                />
            )}
        </div>
    );
};
