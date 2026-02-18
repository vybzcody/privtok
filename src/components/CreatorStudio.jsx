import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Card,
    Form,
    Input,
    Button,
    InputNumber,
    Typography,
    Space,
    Divider,
    Alert,
    Tabs,
    List,
    Row,
    Col,
    Statistic,
    Select,
    Radio,
    Modal
} from 'antd';
import { Link } from 'react-router-dom';
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { encodeStringAsField, stringToFieldInputs, convertFieldToString } from "../core/encoder.js";
import { createTransaction, waitTransactionConfirmation } from "../core/transaction.js";
import { usePrivTokState } from "../components/PrivTokState.jsx";
import { MySubscriptions } from './MySubscriptions.jsx';
import { MyInvites } from './MyInvites.jsx';
import { motion } from 'framer-motion';
import {
    User,
    PlusCircle,
    Layout as LayoutIcon,
    Loader2,
    Shield,
    DollarSign,
    FileText,
    Lock,
    Users,
    TrendingUp,
    BookOpen,
    Gift,
    Video,
    Play,
    Globe,
    Grid,
    Filter
} from 'lucide-react';
import { Badge, Empty, Tag, Spin } from 'antd';
import { toast } from "sonner";
import { PROGRAM_ID } from "../core/constants.js";
import { ContentBadge, ContentTypeBadge } from './content/ContentBadge.jsx';
import {
    getQuadrantFromPost,
    getQuadrant,
    getAllQuadrants,
    formatPrice,
    getQuadrantFilter
} from '../utils/contentMatrix.js';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Analytics Component for Creator Dashboard with Quadrant Breakdown
const CreatorAnalytics = ({ posts }) => {
    const totalAleo = posts.reduce((sum, p) => p.tokenType === 0 ? sum + (p.subscriptionCount || 0) * (p.price || 0) : sum, 0) / 1000000;
    const totalUsdx = posts.reduce((sum, p) => p.tokenType === 1 ? sum + (p.subscriptionCount || 0) * (p.price || 0) : sum, 0) / 1000000;
    const totalSubs = posts.reduce((sum, p) => sum + (p.subscriptionCount || 0), 0);

    // Calculate quadrant breakdown
    const quadrantStats = getAllQuadrants().map(quadrant => {
        const quadrantPosts = posts.filter(p => {
            const postQuadrant = getQuadrantFromPost(p);
            return postQuadrant.id === quadrant.id;
        });

        const quadrantRevenue = quadrantPosts.reduce((sum, p) => {
            const subs = p.subscriptionCount || 0;
            const price = p.price || 0;
            return sum + (subs * price);
        }, 0);

        const quadrantSubs = quadrantPosts.reduce((sum, p) => sum + (p.subscriptionCount || 0), 0);

        return {
            ...quadrant,
            postCount: quadrantPosts.length,
            revenue: quadrantRevenue / 1000000,
            subscribers: quadrantSubs
        };
    });

    return (
        <>
            {/* Top-level metrics */}
            <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass-card" style={{ height: '100%' }}>
                        <Statistic
                            title={<span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '11px' }}>ALEO REVENUE</span>}
                            value={totalAleo}
                            precision={2}
                            suffix="ALEO"
                            valueStyle={{ color: 'white', fontSize: '20px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass-card" style={{ height: '100%' }}>
                        <Statistic
                            title={<span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '11px' }}>USDX REVENUE</span>}
                            value={totalUsdx}
                            precision={2}
                            suffix="USDX"
                            valueStyle={{ color: 'white', fontSize: '20px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass-card" style={{ height: '100%' }}>
                        <Statistic
                            title={<span style={{ fontSize: '11px' }}>TOTAL POSTS</span>}
                            value={posts.length}
                            valueStyle={{ fontSize: '20px' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="glass-card" style={{ height: '100%' }}>
                        <Statistic
                            title={<span style={{ fontSize: '11px' }}>SUBSCRIBERS</span>}
                            value={totalSubs}
                            valueStyle={{ fontSize: '20px' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Quadrant breakdown */}
            <Row gutter={[16, 16]} style={{ marginBottom: '40px' }}>
                <Col xs={24}>
                    <Title level={5} style={{ marginBottom: '16px', color: '#666' }}>CONTENT PERFORMANCE BY QUADRANT</Title>
                </Col>
                {quadrantStats.map((stat) => (
                    <Col xs={24} sm={12} lg={6} key={stat.id}>
                        <Card
                            className="glass-card"
                            style={{
                                height: '100%',
                                border: `1px solid ${stat.borderColor}`,
                                background: `linear-gradient(135deg, ${stat.colorBg} 0%, rgba(0,0,0,0.4) 100%)`
                            }}
                        >
                            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 600, color: stat.color, fontSize: '13px' }}>{stat.name}</div>
                                    <div style={{ fontSize: '10px', color: '#888' }}>{stat.description}</div>
                                </div>
                            </div>
                            <Row gutter={8}>
                                <Col span={12}>
                                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>POSTS</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{stat.postCount}</div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>SUBS</div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{stat.subscribers}</div>
                                </Col>
                            </Row>
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${stat.borderColor}` }}>
                                <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>REVENUE</div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: stat.color }}>
                                    {stat.revenue.toFixed(2)} ALEO
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </>
    );
};

// My Videos Tab Component - Shows created and bought content
const MyVideosTab = () => {
    const { privTokState, updateState } = usePrivTokState();
    const { address, wallet } = useWallet();
    const [filterType, setFilterType] = useState('all');

    const userAddress = address || wallet?.address;
    const allPosts = Object.values(privTokState.posts || {}).filter(p => p.isPrivTok);

    const createdContent = allPosts.filter(post => post.creator === userAddress || post.isCreator);
    const boughtContent = (privTokState.unlockedContent || [])
        .map(u => ({ ...privTokState.posts[u.postId], ...u }))
        .filter(p => p.creator !== userAddress);

    let filteredContent = filterType === 'created' ? createdContent : (filterType === 'bought' ? boughtContent : [...createdContent, ...boughtContent]);

    return (
        <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '24px' }}>
                <Radio.Group value={filterType} onChange={(e) => setFilterType(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="all">ALL</Radio.Button>
                    <Radio.Button value="created">CREATED</Radio.Button>
                    <Radio.Button value="bought">BOUGHT</Radio.Button>
                </Radio.Group>
            </div>

            <List
                dataSource={filteredContent}
                renderItem={(item) => (
                    <List.Item className="glass-card" style={{ padding: '16px', marginBottom: '12px', borderRadius: '12px' }}>
                        <List.Item.Meta
                            avatar={
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '8px',
                                    background: item.isCreator ? 'var(--primary)' : '#3b82f6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {item.isCreator ? <Video size={24} color="white" /> : <Play size={24} color="white" />}
                                </div>
                            }
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{convertFieldToString(item.name || "Untitled")}</span>
                                    <Tag color={item.isCreator ? "success" : "blue"}>{item.isCreator ? "OWNER" : "SUBSCRIBER"}</Tag>
                                </div>
                            }
                            description={
                                <Space size="large">
                                    <span>💰 {(item.price / 1000000).toFixed(2)} {item.tokenType === 1 ? "USDX" : "ALEO"}</span>
                                    <span>ID: {item.postId?.substring(0, 16)}...</span>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />
        </div>
    );
};

export const CreatorStudio = () => {
    const { address, executeTransaction, connected: walletConnected, wallet, transactionStatus } = useWallet();
    const { privTokState, connected, updateState, setDashboardMode, createProfile } = usePrivTokState();
    const queryClient = useQueryClient();
    const [profileForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);

    const mode = privTokState.dashboardMode || 'user';
    const hasProfile = privTokState.hasProfile; // Checked against both mapping and private tickets
    const userAddress = address || wallet?.address;

    // Logging for debug
    console.log("[CreatorStudio] Render State:", {
        mode,
        hasProfile,
        isPublicCreator: privTokState.isPublicCreator,
        isLoading: privTokState.isLoading,
        isFetching: privTokState.isFetching,
        address: address?.substring(0, 15),
        walletAddress: wallet?.address?.substring(0, 15)
    });

    const [contentFilter, setContentFilter] = useState('all'); // all, free_public, paid_public, free_private, paid_private
    const [sortBy, setSortBy] = useState('newest'); // newest, price, subs, revenue
    const [viewMode, setViewMode] = useState('list'); // list, grid

    const userPosts = Object.values(privTokState.posts).filter(p => p.creator === userAddress || p.isCreator);

    const handleCreateProfile = async (values) => {
        try {
            setLoading(true);
            await createProfile(values.name, values.bio);
            setShowRegistration(false); // Close the modal on success
        } catch (error) {
            // Error handled in createProfile toast
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort posts
    const filteredAndSortedPosts = React.useMemo(() => {
        let filtered = [...userPosts];

        // Apply quadrant filter
        if (contentFilter !== 'all') {
            const filter = getQuadrantFilter(contentFilter);
            if (filter) {
                filtered = filtered.filter(post => {
                    const isPaid = (post.price || 0) > 0;
                    const isPrivate = !post.isPublic;
                    return isPaid === filter.isPaid && isPrivate === filter.isPrivate;
                });
            }
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return (b.price || 0) - (a.price || 0);
                case 'subs':
                    return (b.subscriptionCount || 0) - (a.subscriptionCount || 0);
                case 'revenue':
                    const revenueA = (a.subscriptionCount || 0) * (a.price || 0);
                    const revenueB = (b.subscriptionCount || 0) * (b.price || 0);
                    return revenueB - revenueA;
                case 'newest':
                default:
                    return 0; // Would need timestamp for proper sorting
            }
        });

        return filtered;
    }, [userPosts, contentFilter, sortBy]);

    const creatorTabItems = [
        {
            key: 'dashboard',
            label: <span><LayoutIcon size={16} style={{ marginRight: 8 }} />Studio</span>,
            children: (
                <div style={{ paddingTop: '20px' }}>
                    <CreatorAnalytics posts={userPosts} />
                    <Tabs
                        items={[
                            {
                                key: 'posts',
                                label: (
                                    <span><FileText size={14} /> My Content ({filteredAndSortedPosts.length})</span>
                                ),
                                children: (
                                    <div>
                                        {/* Filter Bar */}
                                        <div style={{
                                            marginBottom: '24px',
                                            padding: '16px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <Row gutter={[16, 16]} align="middle">
                                                <Col xs={24} lg={12}>
                                                    <Space wrap>
                                                        <Button
                                                            type={contentFilter === 'all' ? 'primary' : 'default'}
                                                            size="small"
                                                            onClick={() => setContentFilter('all')}
                                                        >
                                                            All ({userPosts.length})
                                                        </Button>
                                                        {getAllQuadrants().map((quadrant) => {
                                                            const count = userPosts.filter(p => {
                                                                const pq = getQuadrantFromPost(p);
                                                                return pq.id === quadrant.id;
                                                            }).length;
                                                            return (
                                                                <Button
                                                                    key={quadrant.id}
                                                                    type={contentFilter === quadrant.id ? 'primary' : 'default'}
                                                                    size="small"
                                                                    onClick={() => setContentFilter(quadrant.id)}
                                                                    style={{
                                                                        borderColor: contentFilter === quadrant.id ? quadrant.color : undefined,
                                                                        background: contentFilter === quadrant.id ? quadrant.colorBg : undefined
                                                                    }}
                                                                >
                                                                    {quadrant.icon} {quadrant.name.split(' ')[0]} ({count})
                                                                </Button>
                                                            );
                                                        })}
                                                    </Space>
                                                </Col>
                                                <Col xs={24} lg={8}>
                                                    <Select
                                                        value={sortBy}
                                                        onChange={setSortBy}
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                        prefix={<Filter size={14} />}
                                                    >
                                                        <Option value="newest">📅 Newest First</Option>
                                                        <Option value="price">💰 Price (High-Low)</Option>
                                                        <Option value="subs">👥 Subscribers</Option>
                                                        <Option value="revenue">📈 Revenue</Option>
                                                    </Select>
                                                </Col>
                                                <Col xs={24} lg={4}>
                                                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                                        <Button
                                                            icon={<Grid size={16} />}
                                                            size="small"
                                                            type={viewMode === 'grid' ? 'primary' : 'default'}
                                                            onClick={() => setViewMode('grid')}
                                                        />
                                                        <Button
                                                            icon={<LayoutIcon size={16} />}
                                                            size="small"
                                                            type={viewMode === 'list' ? 'primary' : 'default'}
                                                            onClick={() => setViewMode('list')}
                                                        />
                                                    </Space>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Content List/Grid */}
                                        {viewMode === 'list' ? (
                                            <List
                                                dataSource={filteredAndSortedPosts}
                                                renderItem={(post) => {
                                                    const quadrant = getQuadrantFromPost(post);
                                                    return (
                                                        <List.Item
                                                            className="glass-card"
                                                            style={{
                                                                padding: '16px',
                                                                marginBottom: '12px',
                                                                borderRadius: '12px',
                                                                border: `1px solid ${quadrant.borderColor}`
                                                            }}
                                                        >
                                                            <List.Item.Meta
                                                                avatar={
                                                                    <div style={{
                                                                        width: '48px',
                                                                        height: '48px',
                                                                        borderRadius: '8px',
                                                                        background: quadrant.colorBg,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        border: `1px solid ${quadrant.borderColor}`
                                                                    }}>
                                                                        <span style={{ fontSize: '24px' }}>{quadrant.icon}</span>
                                                                    </div>
                                                                }
                                                                title={
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                        <span>{convertFieldToString(post.name || "Untitled")}</span>
                                                                        <ContentBadge post={post} size="small" showTooltip={false} />
                                                                    </div>
                                                                }
                                                                description={
                                                                    <Space size="large" style={{ marginTop: '8px' }}>
                                                                        <span>💰 {(post.price / 1000000).toFixed(2)} {post.tokenType === 1 ? "USDX" : "ALEO"}</span>
                                                                        <span>📊 {post.subscriptionCount || 0} subs</span>
                                                                        <span>💎 {(quadrant.revenue || 0).toFixed(2)} ALEO</span>
                                                                    </Space>
                                                                }
                                                            />
                                                        </List.Item>
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <Row gutter={[16, 16]}>
                                                {filteredAndSortedPosts.map((post) => {
                                                    const quadrant = getQuadrantFromPost(post);
                                                    return (
                                                        <Col xs={24} sm={12} lg={8} xl={6} key={post.postId || post.id}>
                                                            <Card
                                                                className="glass-card"
                                                                style={{
                                                                    border: `1px solid ${quadrant.borderColor}`,
                                                                    background: `linear-gradient(135deg, ${quadrant.colorBg} 0%, rgba(0,0,0,0.4) 100%)`,
                                                                    marginBottom: '16px'
                                                                }}
                                                            >
                                                                <div style={{
                                                                    width: '100%',
                                                                    height: '120px',
                                                                    borderRadius: '8px',
                                                                    background: quadrant.colorBg,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginBottom: '12px'
                                                                }}>
                                                                    <span style={{ fontSize: '48px' }}>{quadrant.icon}</span>
                                                                </div>
                                                                <Title level={5} ellipsis={{ rows: 2 }} style={{ marginBottom: '8px', fontSize: '14px' }}>
                                                                    {convertFieldToString(post.name || "Untitled")}
                                                                </Title>
                                                                <div style={{ marginBottom: '12px' }}>
                                                                    <ContentBadge post={post} size="small" showTooltip={false} />
                                                                </div>
                                                                <Row gutter={8}>
                                                                    <Col span={12}>
                                                                        <div style={{ fontSize: '11px', color: '#888' }}>PRICE</div>
                                                                        <div style={{ fontWeight: 600, color: quadrant.color }}>
                                                                            {(post.price / 1000000).toFixed(2)} {post.tokenType === 1 ? 'USDX' : 'ALEO'}
                                                                        </div>
                                                                    </Col>
                                                                    <Col span={12}>
                                                                        <div style={{ fontSize: '11px', color: '#888' }}>SUBS</div>
                                                                        <div style={{ fontWeight: 600, color: 'white' }}>
                                                                            {post.subscriptionCount || 0}
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </Card>
                                                        </Col>
                                                    );
                                                })}
                                            </Row>
                                        )}

                                        {filteredAndSortedPosts.length === 0 && (
                                            <Empty
                                                description={
                                                    <div>
                                                        <div>No content found</div>
                                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                                            Try adjusting your filters or upload new content
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            )
        },
        {
            key: 'upload',
            label: <span><PlusCircle size={16} style={{ marginRight: 8 }} />New Post</span>,
            children: (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <PlusCircle size={48} color="var(--primary)" style={{ marginBottom: '20px' }} />
                    <Title level={3}>Ready to Publish?</Title>
                    <Link to="/upload"><Button type="primary" size="large">GO TO UPLOAD PAGE</Button></Link>
                </div>
            )
        }
    ];

    const userTabItems = [
        {
            key: 'videos',
            label: <span><Video size={16} style={{ marginRight: 8 }} />My Content</span>,
            children: <div style={{ paddingTop: '20px' }}><MyVideosTab /></div>
        },
        {
            key: 'library',
            label: <span><BookOpen size={16} style={{ marginRight: 8 }} />Library</span>,
            children: (
                <div style={{ paddingTop: '20px' }}>
                    <Tabs
                        items={[
                            { key: 'subs', label: 'Subscriptions', children: <MySubscriptions /> },
                            { key: 'invites', label: 'Passes', children: <MyInvites /> }
                        ]}
                    />
                </div>
            )
        }
    ];

    if (!connected) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Lock size={64} color="#333" style={{ marginBottom: '24px' }} />
                <Title level={2}>Connect Wallet</Title>
                <Paragraph>Please connect your wallet to access your dashboard.</Paragraph>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <Title level={1}>{mode === 'creator' ? 'Creator' : 'Individual'} <span className="gradient-text">Dashboard</span></Title>
                        <Paragraph style={{ color: 'var(--text-muted)', margin: 0 }}>{mode === 'creator' ? "Manage your content and earnings on Aleo." : "View your subscriptions and unlocked content."}</Paragraph>
                    </div>
                    <Button
                        icon={privTokState.isFetching ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                        onClick={() => updateState(true)}
                        className="glass-card"
                        style={{ height: '40px' }}
                        disabled={privTokState.isFetching}
                    >
                        {privTokState.isFetching ? 'SYNCING...' : 'SYNC DATA'}
                    </Button>
                </div>

                {(privTokState.isLoading && !hasProfile) && mode === 'creator' ? (
                    <div style={{ textAlign: 'center', padding: '100px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Checking creator status...</div>
                    </div>
                ) : (
                    <>
                        {mode === 'creator' && !hasProfile && (
                            <div style={{ marginBottom: '24px' }}>
                                <Alert
                                    message={<Text strong>Identity Registration Required</Text>}
                                    description={
                                        <div style={{ marginTop: '8px' }}>
                                            <Paragraph style={{ marginBottom: '12px' }}>
                                                You are in Creator Mode but haven't registered your ZK profile yet. 
                                                You can browse the studio, but registration is required to publish content.
                                            </Paragraph>
                                            <Button 
                                                type="primary" 
                                                icon={<Shield size={16} />} 
                                                onClick={() => setShowRegistration(true)}
                                            >
                                                Register Creator Profile
                                            </Button>
                                        </div>
                                    }
                                    type="warning"
                                    showIcon
                                    closable={false}
                                    className="glass-card"
                                />

                                <Modal
                                    title={<Title level={4} style={{ margin: 0 }}>Register Identity</Title>}
                                    open={showRegistration}
                                    onCancel={() => setShowRegistration(false)}
                                    footer={null}
                                    centered
                                    className="glass-modal"
                                >
                                    <div style={{ padding: '12px 0' }}>
                                        <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
                                            Registering your identity creates a private record on Aleo that proves you are the owner of your content.
                                        </Paragraph>
                                        <Form form={profileForm} layout="vertical" onFinish={handleCreateProfile}>
                                            <Form.Item 
                                                name="name" 
                                                label={<Text strong>Display Name</Text>} 
                                                rules={[{ required: true, message: 'Please enter a display name' }]}
                                            >
                                                <Input placeholder="Your Stage Name" className="glass-input" />
                                            </Form.Item>
                                            <Form.Item 
                                                name="bio" 
                                                label={<Text strong>Bio</Text>} 
                                                rules={[{ required: true, message: 'Please enter a bio' }]}
                                            >
                                                <Input.TextArea rows={4} placeholder="What do you create?" className="glass-input" />
                                            </Form.Item>
                                            <Button 
                                                className="btn-primary" 
                                                htmlType="submit" 
                                                loading={loading} 
                                                block 
                                                style={{ height: '50px', marginTop: '12px' }}
                                            >
                                                REGISTER ON-CHAIN
                                            </Button>
                                        </Form>
                                    </div>
                                </Modal>
                            </div>
                        )}
                        <Tabs defaultActiveKey={mode === 'creator' ? 'dashboard' : 'videos'} items={mode === 'creator' ? creatorTabItems : userTabItems} className="privtok-tabs" />
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default CreatorStudio;
