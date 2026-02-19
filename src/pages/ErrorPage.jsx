import React from 'react';
import { useRouteError, Link, isRouteErrorResponse } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertTriangle, RefreshCcw, Compass } from 'lucide-react';
import { Button, Typography } from 'antd';

const { Title, Text } = Typography;

export const ErrorPage = () => {
    const error = useRouteError();
    console.error(error);

    const is404 = isRouteErrorResponse(error) && error.status === 404;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            background: '#121212',
            color: '#fff',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ marginBottom: '24px' }}>
                    {is404 ? (
                        <h1 style={{
                            fontSize: 'clamp(6rem, 15vw, 12rem)',
                            margin: 0,
                            fontWeight: 900,
                            lineHeight: 1,
                            background: 'linear-gradient(135deg, #FF0000, #ff4d4f)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 30px rgba(255, 0, 0, 0.3))'
                        }}>
                            404
                        </h1>
                    ) : (
                        <AlertTriangle size={120} color="#FF0000" style={{ margin: '0 auto' }} />
                    )}
                </div>

                <Title level={2} style={{ color: '#fff', marginBottom: '16px' }}>
                    {is404 ? "Lost in the Private Space?" : "Unexpected Application Error"}
                </Title>

                <Text style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '500px', display: 'block', margin: '0 auto 40px', fontSize: '1.1rem' }}>
                    {is404 
                        ? "The content you're looking for has either been moved, deleted, or never existed in this realm of the Aleo blockchain."
                        : (error.statusText || error.message || "An unknown error occurred while processing your request.")}
                </Text>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/">
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<Home size={20} />}
                            style={{ height: '48px', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            Back to Home
                        </Button>
                    </Link>
                    
                    {is404 ? (
                        <Link to="/hub">
                            <Button 
                                size="large" 
                                icon={<Compass size={20} />}
                                style={{ height: '48px', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                Explore Hub
                            </Button>
                        </Link>
                    ) : (
                        <Button 
                            size="large" 
                            icon={<RefreshCcw size={20} />}
                            onClick={() => window.location.reload()}
                            style={{ height: '48px', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            Reload Page
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Background Glow */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: '#FF0000',
                filter: 'blur(150px)',
                opacity: 0.05,
                zIndex: -1,
                borderRadius: '50%'
            }} />
        </div>
    );
};

export default ErrorPage;
