import React, { useState, useEffect } from 'react';
import { Card, List, Button, Typography, Space, Tag, Row, Col, Input, Empty, Radio, Spin, Select, Badge, Divider } from 'antd';
import { usePrivTokState } from "../components/PrivTokState.jsx";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { createTransaction, waitTransactionConfirmation } from "../core/transaction.js";
import { convertFieldToString } from "../core/encoder.js";
import { motion } from 'framer-motion';
import { Play, Lock, Loader2, Unlock, Search, Music, Image as ImageIcon, FileText, Video, User, Filter, DollarSign, Gift, Grid, Layout, Globe } from 'lucide-react';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { ContentTypeBadge } from './content/ContentBadge.jsx';
import { getQuadrantFromPost, getQuadrant, getAllQuadrants, getQuadrantFilter } from '../utils/contentMatrix.js';
import { generateRandomScalar } from "../core/encoder.js";

const { Title, Text } = Typography;
const { Search: AntdSearch } = Input;
const { Option } = Select;

// Content type icon
const getContentTypeIcon = (type) => {
    switch (type) {
        case 'video': return <Video size={16} />;
        case 'audio': return <Music size={16} />;
        case 'image': return <ImageIcon size={16} />;
        case 'document': return <FileText size={16} />;
        default: return <FileText size={16} />;
    }
};

export const ContentHub = () => {
    const { privTokState, hasAccessToContent, subscribeToContent, isLoading } = usePrivTokState();
    const { address, connected } = useWallet();
    const [loadingMap, setLoadingMap] = useState({});

    // Filter state - Enhanced with 2x2 matrix filters
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid');
    
    // 2x2 Matrix filters
    const [paymentFilter, setPaymentFilter] = useState('all'); // all, free, paid
    const [visibilityFilter, setVisibilityFilter] = useState('all'); // all, public, private
    const [quadrantFilter, setQuadrantFilter] = useState('all'); // all, free_public, paid_public, free_private, paid_private

    const hasAccess = (postId) => {
        return hasAccessToContent(postId);
    };

    // Check if current user is the creator of a post
    const isCreator = (post) => {
        if (!address || !post.creator) return false;
        // Normalize both addresses for comparison
        const cleanCreator = typeof post.creator === 'string'
            ? post.creator.replace('.private', '').replace('.public', '')
            : convertFieldToString(post.creator);
        return address === cleanCreator;
    };

    // Get ALL posts for discovery (shows all content user can discover)
    const allPosts = Object.values(privTokState.posts || {}).filter(p => {
        // Must be PrivTok post
        if (!p.isPrivTok) return false;
        // Must be public
        if (!p.isPublic) return false;
        // Must NOT be created by current user
        if (isCreator(p)) return false;
        return true;
    });

    // Filter and sort posts for discovery with 2x2 matrix
    const filteredPosts = allPosts.filter(post => {
        // Search filter
        if (searchQuery) {
            const postName = post.name ? convertFieldToString(post.name).toLowerCase() : '';
            const creatorAddress = post.creator?.toLowerCase() || '';
            return postName.includes(searchQuery.toLowerCase()) ||
                creatorAddress.includes(searchQuery.toLowerCase());
        }
        
        // Quadrant filter (most specific)
        if (quadrantFilter !== 'all') {
            const filter = getQuadrantFilter(quadrantFilter);
            if (filter) {
                const isPaid = (post.price || 0) > 0;
                const isPrivate = !post.isPublic;
                return isPaid === filter.isPaid && isPrivate === filter.isPrivate;
            }
        }
        
        // Payment filter
        if (paymentFilter !== 'all') {
            const isPaid = (post.price || 0) > 0;
            if (paymentFilter === 'free' && isPaid) return false;
            if (paymentFilter === 'paid' && !isPaid) return false;
        }
        
        // Visibility filter
        if (visibilityFilter !== 'all') {
            const isPrivate = !post.isPublic;
            if (visibilityFilter === 'public' && isPrivate) return false;
            if (visibilityFilter === 'private' && !isPrivate) return false;
        }
        
        return true;
    }).sort((a, b) => {
        switch (sortBy) {
            case 'price_asc':
                return (a.price || 0) - (b.price || 0);
            case 'price_desc':
                return (b.price || 0) - (a.price || 0);
            case 'newest':
            default:
                const aId = a.postId || a.id || '';
                const bId = b.postId || b.id || '';
                return aId.localeCompare(bId);
        }
    });

    const handleSubscribe = async (post) => {
        const postId = post.id || post.postId;
        const tokenType = post.tokenType || 0; // 0: ALEO, 1: USDX
        const assetName = tokenType === 0 ? "ALEO" : "USDX";
        const toastId = toast.loading(`Processing ${assetName} subscription...`);

        try {
            setLoadingMap(prev => ({ ...prev, [postId]: true }));

            // Using the new atomic subscribeToContent helper from PrivTokState
            await subscribeToContent(post, tokenType);

            // State update is handled inside subscribeToContent
        } catch (error) {
            console.error('Error subscribing:', error);
            // toast error also handled inside or can be added here if needed
        } finally {
            setLoadingMap(prev => ({ ...prev, [postId]: false }));
        }
    };

    const renderGridItem = (post) => {
        const postId = post.id || post.postId;
        const unlocked = hasAccessToContent(postId) || isCreator(post);
        const isLoading = loadingMap[postId];
        const postName = post.name ? convertFieldToString(post.name) : 'Untitled';
        const tokenType = post.tokenType || 0;
        const assetName = tokenType === 0 ? "ALEO" : "USDX";
        const priceFormatted = (post.price / 1000000).toFixed(2);
        const quadrant = getQuadrantFromPost(post);

        // Format creator address
        const formatCreator = (creator) => {
            if (!creator) return 'Anonymous';
            if (typeof creator !== 'string') return 'Anonymous';
            if (creator.startsWith('aleo1')) {
                return creator.substring(0, 15) + '...';
            }
            return 'Anonymous';
        };
        const creatorDisplay = formatCreator(post.creator);

        return (
            <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
            >
                <Card
                    className="glass-card"
                    style={{
                        border: `1px solid ${quadrant.borderColor}`,
                    }}
                    cover={
                        <div style={{
                            height: '180px',
                            background: unlocked
                                ? 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)'
                                : 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderTopLeftRadius: '12px',
                            borderTopRightRadius: '12px',
                            position: 'relative'
                        }}>
                            {unlocked ? (
                                <Play size={48} color="var(--primary)" />
                            ) : (
                                <Lock size={48} color="#444" />
                            )}
                            <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                                <ContentTypeBadge 
                                    isPaid={(post.price || 0) > 0} 
                                    isPrivate={!post.isPublic}
                                    showLabel={false}
                                />
                            </div>
                            {tokenType === 1 && (
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <Tag color="gold">USDX</Tag>
                                </div>
                            )}
                            {!unlocked && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    right: '12px'
                                }}>
                                    <Tag color="error">LOCKED</Tag>
                                </div>
                            )}
                        </div>
                    }
                >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <Title level={4} style={{ margin: 0, fontSize: '16px' }}>
                                    {postName}
                                </Title>
                            </div>
                            <Link to={`/creator/${post.creator}`}>
                                <Text type="secondary" style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <User size={12} />
                                    By: {creatorDisplay}
                                </Text>
                            </Link>
                        </div>

                        {!unlocked ? (
                            <>
                                <Divider style={{ margin: '8px 0', borderColor: '#333' }} />
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>PRICE</div>
                                        <Text strong style={{ fontSize: '18px', color: quadrant.color }}>
                                            {priceFormatted} <span style={{ fontSize: '12px' }}>{assetName}</span>
                                        </Text>
                                    </Col>
                                    <Col>
                                        <Button
                                            type="primary"
                                            className="btn-primary"
                                            icon={isLoading ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />}
                                            onClick={() => handleSubscribe(post)}
                                            loading={isLoading}
                                            style={{ height: '40px', padding: '0 24px' }}
                                        >
                                            SUBSCRIBE
                                        </Button>
                                    </Col>
                                </Row>
                            </>
                        ) : (
                            <Button
                                block
                                type="primary"
                                icon={<Play size={16} />}
                                onClick={() => window.__PRIVTOK_VIEW_CONTENT__?.(post)}
                                style={{ height: '40px' }}
                            >
                                VIEW CONTENT
                            </Button>
                        )}
                    </Space>
                </Card>
            </motion.div>
        );
    };

    return (
        <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '32px' }}>
                <Title level={1}>Explore <span className="gradient-text">Content</span></Title>
                <Text style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Discover exclusive content from creators on Aleo
                </Text>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '20px', fontSize: '16px', color: '#666' }}>
                        Loading public posts from Aleo...
                    </div>
                </div>
            )}

            {!isLoading && (
                <>
                    {/* Search Bar */}
                    <div style={{ marginBottom: '24px' }}>
                        <AntdSearch
                            placeholder="Search content or creator"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            prefix={<Search size={16} color="#666" />}
                            size="large"
                            allowClear
                            style={{ maxWidth: '600px' }}
                        />
                    </div>

                    {/* 2x2 Matrix Filter Bar */}
                    <Card className="glass-card" style={{ marginBottom: '24px', padding: '16px' }}>
                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} lg={16}>
                                <Space wrap size="small">
                                    <Button
                                        size="small"
                                        type={quadrantFilter === 'all' ? 'primary' : 'default'}
                                        onClick={() => setQuadrantFilter('all')}
                                    >
                                        All ({allPosts.length})
                                    </Button>
                                    {getAllQuadrants().map((quadrant) => {
                                        const count = allPosts.filter(p => {
                                            const pq = getQuadrantFromPost(p);
                                            return pq.id === quadrant.id;
                                        }).length;
                                        return (
                                            <Button
                                                key={quadrant.id}
                                                size="small"
                                                type={quadrantFilter === quadrant.id ? 'primary' : 'default'}
                                                onClick={() => setQuadrantFilter(quadrant.id)}
                                                style={{
                                                    borderColor: quadrantFilter === quadrant.id ? quadrant.color : undefined,
                                                    background: quadrantFilter === quadrant.id ? quadrant.colorBg : undefined
                                                }}
                                            >
                                                {quadrant.icon} {quadrant.name} ({count})
                                            </Button>
                                        );
                                    })}
                                </Space>
                            </Col>
                            <Col xs={24} lg={8}>
                                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                    <Select
                                        value={sortBy}
                                        onChange={setSortBy}
                                        style={{ width: '160px' }}
                                        size="small"
                                        prefix={<Filter size={14} />}
                                    >
                                        <Option value="newest">📅 Newest</Option>
                                        <Option value="price_asc">💰 Price (Low-High)</Option>
                                        <Option value="price_desc">💰 Price (High-Low)</Option>
                                    </Select>
                                    <Button
                                        icon={<Grid size={16} />}
                                        size="small"
                                        type={viewMode === 'grid' ? 'primary' : 'default'}
                                        onClick={() => setViewMode('grid')}
                                    />
                                    <Button
                                        icon={<Layout size={16} />}
                                        size="small"
                                        type={viewMode === 'list' ? 'primary' : 'default'}
                                        onClick={() => setViewMode('list')}
                                    />
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    {/* Quick Filter Pills */}
                    <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <Space wrap size="small">
                            <Tag 
                                color={paymentFilter === 'all' ? 'blue' : 'default'}
                                style={{ cursor: 'pointer', padding: '4px 12px' }}
                                onClick={() => setPaymentFilter(paymentFilter === 'free' ? 'all' : 'free')}
                            >
                                🆓 FREE
                            </Tag>
                            <Tag 
                                color={paymentFilter === 'paid' ? 'blue' : 'default'}
                                style={{ cursor: 'pointer', padding: '4px 12px' }}
                                onClick={() => setPaymentFilter(paymentFilter === 'paid' ? 'all' : 'paid')}
                            >
                                💰 PAID
                            </Tag>
                            <Tag 
                                icon={<Globe size={12} />}
                                color={visibilityFilter === 'public' ? 'green' : 'default'}
                                style={{ cursor: 'pointer', padding: '4px 12px' }}
                                onClick={() => setVisibilityFilter(visibilityFilter === 'public' ? 'all' : 'public')}
                            >
                                PUBLIC
                            </Tag>
                            <Tag 
                                icon={<Lock size={12} />}
                                color={visibilityFilter === 'private' ? 'gold' : 'default'}
                                style={{ cursor: 'pointer', padding: '4px 12px' }}
                                onClick={() => setVisibilityFilter(visibilityFilter === 'private' ? 'all' : 'private')}
                            >
                                PRIVATE
                            </Tag>
                        </Space>
                        {(paymentFilter !== 'all' || visibilityFilter !== 'all' || quadrantFilter !== 'all') && (
                            <Button 
                                size="small" 
                                onClick={() => {
                                    setPaymentFilter('all');
                                    setVisibilityFilter('all');
                                    setQuadrantFilter('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>

                    {/* Content Grid/List */}
                    {filteredPosts.length === 0 ? (
                        <Empty
                            description={
                                <div>
                                    <p>No content found matching your filters</p>
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                        Try adjusting your filters or search query
                                    </p>
                                </div>
                            }
                            style={{ padding: '60px 0' }}
                        />
                    ) : (
                        <List
                            grid={viewMode === 'grid' ? {
                                gutter: 24,
                                xs: 1,
                                sm: 1,
                                md: 2,
                                lg: 2,
                                xl: 3,
                                xxl: 3
                            } : undefined}
                            dataSource={filteredPosts}
                            renderItem={post => renderGridItem(post)}
                        />
                    )}
                </>
            )}
        </div>
    );
};
