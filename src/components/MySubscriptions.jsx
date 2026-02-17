import React from 'react';
import { List, Card, Typography, Tag, Space, Button, Row, Col, Divider, Empty } from 'antd';
import { Link } from 'react-router-dom';
import { usePrivTokState } from "../components/PrivTokState.jsx";
import { convertFieldToString } from "../core/encoder.js";
import { filterVisibility } from "../core/processing.js";
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Play, Unlock, Shield } from 'lucide-react';

const { Title, Text, Paragraph } = Typography;

export const MySubscriptions = () => {
    const { privTokState } = usePrivTokState();

    // Use subscriberAccess records as the source of truth for owned content
    const activeSubscriptions = privTokState.subscriberAccess || [];

    const getPostName = (postData) => {
        if (!postData || !postData.contentId) return "Secured Content";
        return convertFieldToString(postData.contentId);
    };

    return (
        <div style={{ width: '100%' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ marginBottom: '48px' }}>
                    <Title level={1}>My <span className="gradient-text">Content</span></Title>
                    <Paragraph style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Your private library of unlocked content. All decryption keys are derived locally from your Aleo identity.
                    </Paragraph>
                </div>

                {activeSubscriptions.length === 0 ? (
                    <div style={{ padding: '80px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed #333' }}>
                        <BookOpen size={64} color="#333" style={{ marginBottom: '24px' }} />
                        <Title level={3} style={{ color: '#888' }}>Your Library is Empty</Title>
                        <Paragraph style={{ color: '#666', marginBottom: '32px' }}>Explore the Hub to discover and subscribe to exclusive content from your favorite creators.</Paragraph>
                        <Link to="/hub">
                            <Button type="primary" size="large" className="btn-primary">EXPLORE CONTENT HUB</Button>
                        </Link>
                    </div>
                ) : (
                    <List
                        grid={{ gutter: 24, xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
                        dataSource={activeSubscriptions}
                        renderItem={access => {
                            const postData = access.data?.post ? JSON.parse(access.data.post.replace(/'/g, '"')) : (access.postData || {});
                            const postId = filterVisibility(access.data?.post_id || access.postId);
                            const tokenType = parseInt(filterVisibility(String(access.data?.token_type || access.tokenType || "0u8")).replace('u8', ''));
                            const assetName = tokenType === 1 ? "USDX" : "ALEO";

                            return (
                                <List.Item>
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className="glass-card">
                                            <Row gutter={20} align="middle">
                                                <Col span={4}>
                                                    <div style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        borderRadius: '12px',
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '1px solid var(--success)'
                                                    }}>
                                                        <Shield size={28} color="var(--success)" />
                                                    </div>
                                                </Col>
                                                <Col span={14}>
                                                    <div style={{ paddingLeft: '8px' }}>
                                                        <Title level={4} style={{ margin: 0, fontSize: '18px' }}>
                                                            {getPostName(postData)}
                                                        </Title>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            Asset: {assetName} • Verified ZK
                                                        </Text>
                                                    </div>
                                                </Col>
                                                <Col span={6} style={{ textAlign: 'right' }}>
                                                    <Tag color="success" style={{ margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>
                                                        Active
                                                    </Tag>
                                                </Col>
                                            </Row>

                                            <Divider style={{ margin: '20px 0', borderColor: '#333' }} />

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Space size="large">
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PRICE</div>
                                                        <Text strong>
                                                            {parseInt(filterVisibility(String(postData.price || "0u128")).replace('u128', '')) / 1000000} {assetName}
                                                        </Text>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>STATUS</div>
                                                        <Text strong style={{ color: '#10b981' }}>UNLOCKED</Text>
                                                    </div>
                                                </Space>

                                                <Button
                                                    type="primary"
                                                    className="btn-primary"
                                                    icon={<Play size={16} />}
                                                    onClick={() => {
                                                        window.__PRIVTOK_VIEW_CONTENT__?.({
                                                            id: postId,
                                                            title: getPostName(postData)
                                                        });
                                                    }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    VIEW NOW
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                </List.Item>
                            );
                        }}
                    />
                )}
            </motion.div>
        </div>
    );
};
