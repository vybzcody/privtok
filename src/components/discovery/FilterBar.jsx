import React from 'react';
import { Select, Radio, Space, Typography } from 'antd';
import { Grid, List, TrendingUp, DollarSign, Clock } from 'lucide-react';

const { Text } = Typography;

export const CategoryFilter = ({ value, onChange }) => {
    return (
        <Radio.Group value={value} onChange={onChange} buttonStyle="solid">
            <Radio.Button value="all">All</Radio.Button>
            <Radio.Button value="video">🎥 Video</Radio.Button>
            <Radio.Button value="audio">🎵 Audio</Radio.Button>
            <Radio.Button value="image">🖼️ Image</Radio.Button>
            <Radio.Button value="document">📄 Document</Radio.Button>
        </Radio.Group>
    );
};

export const SortFilter = ({ value, onChange }) => {
    return (
        <Select 
            value={value} 
            onChange={onChange}
            style={{ width: '180px' }}
            options={[
                { value: 'newest', label: '🕐 Newest First', icon: <Clock size={14} /> },
                { value: 'price_asc', label: '💰 Price: Low to High', icon: <DollarSign size={14} /> },
                { value: 'price_desc', label: '💰 Price: High to Low', icon: <DollarSign size={14} /> },
                { value: 'popular', label: '📈 Most Popular', icon: <TrendingUp size={14} /> }
            ]}
        />
    );
};

export const ViewToggle = ({ value, onChange }) => {
    return (
        <Radio.Group value={value} onChange={onChange} buttonStyle="solid">
            <Radio.Button value="grid">
                <Grid size={16} />
            </Radio.Button>
            <Radio.Button value="list">
                <List size={16} />
            </Radio.Button>
        </Radio.Group>
    );
};

export const FilterBar = ({ 
    category, 
    onCategoryChange, 
    sortBy, 
    onSortChange,
    viewMode,
    onViewModeChange,
    searchQuery,
    onSearchChange
}) => {
    return (
        <div style={{ 
            marginBottom: '32px', 
            padding: '20px', 
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)'
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                {/* Left: Category Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text strong>Category:</Text>
                    <CategoryFilter value={category} onChange={onCategoryChange} />
                </div>

                {/* Right: Sort and View Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <SortFilter value={sortBy} onChange={onSortChange} />
                    
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
                    
                    <ViewToggle value={viewMode} onChange={onViewModeChange} />
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
