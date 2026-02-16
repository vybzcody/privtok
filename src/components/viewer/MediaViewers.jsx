import React, { useState } from 'react';
import { Typography, Spin } from 'antd';
import { Download } from 'lucide-react';

const { Title } = Typography;

export const VideoViewer = ({ src, title }) => {
    const [loading, setLoading] = useState(true);
    
    return (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px' 
            }}>
                <Title level={4} style={{ margin: 0 }}>{title}</Title>
                <a 
                    href={src} 
                    download 
                    style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Download size={18} /> Download
                </a>
            </div>
            
            {loading && (
                <div style={{ 
                    width: '100%', 
                    aspectRatio: '16/9', 
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    marginBottom: '16px'
                }}>
                    <Spin />
                </div>
            )}
            
            <video 
                controls 
                autoPlay
                style={{ 
                    width: '100%', 
                    borderRadius: '12px',
                    display: loading ? 'none' : 'block'
                }}
                src={src}
                onLoadedData={() => setLoading(false)}
            />
            
            <div style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#10b981'
            }}>
                🔒 Content decrypted privately using zero-knowledge proof
            </div>
        </div>
    );
};

export const AudioViewer = ({ src, title }) => {
    const [loading, setLoading] = useState(true);
    
    return (
        <div style={{ padding: '20px' }}>
            <Title level={4}>{title}</Title>
            {loading && <Spin style={{ marginBottom: '16px' }} />}
            <audio 
                controls 
                autoPlay 
                style={{ width: '100%', display: loading ? 'none' : 'block' }} 
                src={src}
                onLoadedData={() => setLoading(false)}
            />
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                🔒 Privately decrypted audio content
            </div>
        </div>
    );
};

export const ImageViewer = ({ src, title }) => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
        <Title level={4}>{title}</Title>
        <img 
            src={src} 
            alt={title}
            style={{ maxWidth: '100%', borderRadius: '12px' }}
        />
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
            🔒 Privately decrypted image content
        </div>
    </div>
);

export const DocumentViewer = ({ src, title }) => (
    <div style={{ padding: '20px' }}>
        <Title level={4}>{title}</Title>
        <iframe 
            src={src}
            style={{ width: '100%', height: '600px', border: 'none', borderRadius: '12px' }}
            title={title}
        />
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
            🔒 Privately decrypted document content
        </div>
    </div>
);
