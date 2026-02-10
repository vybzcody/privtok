import React from 'react';
import { Tag, Tooltip } from 'antd';
import { Globe, Lock, DollarSign, Gift } from 'lucide-react';
import { getQuadrantFromPost, getQuadrant } from '../../utils/contentMatrix';

/**
 * Content Badge Component - Displays content quadrant visually
 * 
 * @param {object} post - Post object with isPublic and price fields
 * @param {string} size - Badge size: 'small', 'default', 'large'
 * @param {boolean} showTooltip - Show tooltip with quadrant info
 * @param {boolean} showPrice - Show price if paid
 */
export const ContentBadge = ({ post, size = 'default', showTooltip = true, showPrice = true }) => {
  const quadrant = getQuadrantFromPost(post);
  const isPaid = (post.price || 0) > 0;
  const isPrivate = !post.isPublic;

  const getIcon = () => {
    const iconProps = {
      size: size === 'small' ? 12 : size === 'large' ? 18 : 14
    };
    
    if (isPrivate) {
      return <Lock {...iconProps} />;
    }
    if (isPaid) {
      return <DollarSign {...iconProps} />;
    }
    return <Globe {...iconProps} />;
  };

  const badgeContent = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: size === 'small' ? '2px 6px' : '4px 8px'
    }}>
      {getIcon()}
      <span style={{ fontSize: size === 'small' ? '10px' : '12px', fontWeight: 600 }}>
        {quadrant.name}
      </span>
      {showPrice && isPaid && post.price && (
        <span style={{ 
          fontSize: size === 'small' ? '9px' : '11px',
          color: quadrant.color,
          fontWeight: 700
        }}>
          • {(post.price / 1000000).toFixed(2)} {post.tokenType === 1 ? 'USDX' : 'ALEO'}
        </span>
      )}
    </div>
  );

  const badgeElement = (
    <Tag
      style={{
        background: quadrant.colorBg,
        borderColor: quadrant.borderColor,
        color: quadrant.color,
        borderStyle: 'solid',
        borderWidth: '1px',
        cursor: showTooltip ? 'help' : 'default',
        margin: 0
      }}
    >
      {badgeContent}
    </Tag>
  );

  if (!showTooltip) return badgeElement;

  return (
    <Tooltip
      title={
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: quadrant.color }}>
            {quadrant.icon} {quadrant.name}
          </div>
          <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '8px' }}>
            {quadrant.description}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            <div>Use cases: {quadrant.useCases.join(', ')}</div>
            <div>Target: {quadrant.target}</div>
          </div>
        </div>
      }
    >
      {badgeElement}
    </Tooltip>
  );
};

/**
 * Quadrant Selector Component - Visual 2x2 matrix picker
 * 
 * @param {object} value - { isPaid, isPrivate }
 * @param {function} onChange - Callback when selection changes
 * @param {boolean} disabled - Disable selection
 */
export const QuadrantSelector = ({ value, onChange, disabled = false }) => {
  const { isPaid = false, isPrivate = false } = value || {};

  const quadrants = [
    { isPaid: false, isPrivate: false, quadrant: 'FREE_PUBLIC' },
    { isPaid: true, isPrivate: false, quadrant: 'PAID_PUBLIC' },
    { isPaid: false, isPrivate: true, quadrant: 'FREE_PRIVATE' },
    { isPaid: true, isPrivate: true, quadrant: 'PAID_PRIVATE' }
  ];

  const handleSelect = (selected) => {
    if (disabled) return;
    onChange?.({ isPaid: selected.isPaid, isPrivate: selected.isPrivate });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '8px',
        maxWidth: '500px'
      }}>
        {quadrants.map((q) => {
          const quadrantData = getQuadrant(q.isPaid, q.isPrivate);
          const isSelected = isPaid === q.isPaid && isPrivate === q.isPrivate;
          
          return (
            <div
              key={q.quadrant}
              onClick={() => handleSelect(q)}
              style={{
                padding: '16px',
                background: isSelected ? quadrantData.colorBg : 'rgba(255,255,255,0.02)',
                border: `2px solid ${isSelected ? quadrantData.color : quadrantData.borderColor}`,
                borderRadius: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
                position: 'relative'
              }}
              className={disabled ? '' : 'hover-card'}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: quadrantData.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}>
                  ✓
                </div>
              )}
              
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {quadrantData.icon}
              </div>
              <div style={{ 
                fontWeight: 600, 
                marginBottom: '4px',
                color: isSelected ? quadrantData.color : 'white'
              }}>
                {quadrantData.name}
              </div>
              <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.4' }}>
                {quadrantData.description}
              </div>
              <div style={{ 
                marginTop: '8px', 
                paddingTop: '8px', 
                borderTop: `1px solid ${quadrantData.borderColor}`,
                fontSize: '10px',
                color: '#888'
              }}>
                {quadrantData.useCases.slice(0, 2).join(' • ')}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
        💡 Tip: {isPaid ? 'Paid' : 'Free'} {isPrivate ? 'Private' : 'Public'} content is best for {getQuadrant(isPaid, isPrivate).target.toLowerCase()}
      </div>
    </div>
  );
};

/**
 * Content Type Badge - Simplified version for lists
 */
export const ContentTypeBadge = ({ isPaid, isPrivate, showLabel = true }) => {
  const quadrant = getQuadrant(isPaid, isPrivate);
  
  return (
    <Tag
      style={{
        background: quadrant.colorBg,
        borderColor: quadrant.borderColor,
        color: quadrant.color,
        margin: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
      {showLabel && <span>{quadrant.name}</span>}
    </Tag>
  );
};

export default ContentBadge;
