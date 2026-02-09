/**
 * Content Matrix System - 2x2 Visibility/Pricing Model
 * 
 * Quadrants:
 * - Free Public (0,0): Discovery content, teasers
 * - Paid Public (1,0): Main revenue, courses
 * - Free Private (0,1): Community exclusives
 * - Paid Private (1,1): VIP content, 1-on-1
 */

// Content visibility types
export const VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private'
};

// Content pricing types
export const PRICING = {
  FREE: 'free',
  PAID: 'paid'
};

// Quadrant definitions with colors and metadata
export const CONTENT_QUADRANTS = {
  FREE_PUBLIC: {
    id: 'free_public',
    name: 'Free Public',
    description: 'Discovery content for maximum reach',
    color: '#10b981', // Green
    colorBg: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    icon: '🔓',
    badgeIcon: '🌍',
    useCases: ['Teasers', 'Trailers', 'Freebies', 'Ad-supported'],
    priceRange: '$0',
    target: 'Audience growth'
  },
  PAID_PUBLIC: {
    id: 'paid_public',
    name: 'Paid Public',
    description: 'Main revenue content',
    color: '#3b82f6', // Blue
    colorBg: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    icon: '💰',
    badgeIcon: '🌍',
    useCases: ['Courses', 'Tutorials', 'Subscriptions'],
    priceRange: '$5-50',
    target: 'Revenue driver'
  },
  FREE_PRIVATE: {
    id: 'free_private',
    name: 'Free Private',
    description: 'Exclusive community content',
    color: '#f59e0b', // Yellow/Amber
    colorBg: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    icon: '🎁',
    badgeIcon: '🔒',
    useCases: ['Community', 'Lead magnet', 'Exclusives'],
    priceRange: '$0',
    target: 'Engagement'
  },
  PAID_PRIVATE: {
    id: 'paid_private',
    name: 'Paid Private',
    description: 'Ultra-premium VIP content',
    color: '#8b5cf6', // Purple
    colorBg: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    icon: '💎',
    badgeIcon: '🔒',
    useCases: ['VIP', '1-on-1', 'Beta access', 'Coaching'],
    priceRange: '$50-500+',
    target: 'High-value fans'
  }
};

/**
 * Get quadrant from visibility and pricing
 * @param {boolean} isPaid - Whether content is paid
 * @param {boolean} isPrivate - Whether content is private
 * @returns {string} Quadrant ID
 */
export const getQuadrantId = (isPaid, isPrivate) => {
  if (!isPaid && !isPrivate) return 'FREE_PUBLIC';
  if (isPaid && !isPrivate) return 'PAID_PUBLIC';
  if (!isPaid && isPrivate) return 'FREE_PRIVATE';
  if (isPaid && isPrivate) return 'PAID_PRIVATE';
  return 'FREE_PUBLIC'; // Default
};

/**
 * Get quadrant data from visibility and pricing
 * @param {boolean} isPaid - Whether content is paid
 * @param {boolean} isPrivate - Whether content is private
 * @returns {object} Quadrant data
 */
export const getQuadrant = (isPaid, isPrivate) => {
  const quadrantId = getQuadrantId(isPaid, isPrivate);
  return CONTENT_QUADRANTS[quadrantId];
};

/**
 * Get quadrant from post data
 * @param {object} post - Post object with isPublic and price fields
 * @returns {object} Quadrant data
 */
export const getQuadrantFromPost = (post) => {
  const isPublic = post.isPublic !== false; // Default to public if not set
  const isPaid = (post.price || 0) > 0;
  return getQuadrant(isPaid, !isPublic);
};

/**
 * Get filter value for API/queries
 * @param {string} quadrantId - Quadrant ID
 * @returns {object} Filter object
 */
export const getQuadrantFilter = (quadrantId) => {
  switch (quadrantId) {
    case 'free_public':
      return { isPaid: false, isPrivate: false };
    case 'paid_public':
      return { isPaid: true, isPrivate: false };
    case 'free_private':
      return { isPaid: false, isPrivate: true };
    case 'paid_private':
      return { isPaid: true, isPrivate: true };
    default:
      return null;
  }
};

/**
 * Get all quadrants as array for iteration
 * @returns {array} Array of quadrant objects
 */
export const getAllQuadrants = () => {
  return Object.values(CONTENT_QUADRANTS);
};

/**
 * Get quadrants by payment type
 * @param {boolean} isPaid - Filter by paid content
 * @returns {array} Filtered quadrants
 */
export const getQuadrantsByPayment = (isPaid) => {
  return getAllQuadrants().filter(q => {
    const paid = q.id.startsWith('paid');
    return isPaid ? paid : !paid;
  });
};

/**
 * Get quadrants by visibility
 * @param {boolean} isPrivate - Filter by private content
 * @returns {array} Filtered quadrants
 */
export const getQuadrantsByVisibility = (isPrivate) => {
  return getAllQuadrants().filter(q => {
    const private_content = q.id.endsWith('private');
    return isPrivate ? private_content : !private_content;
  });
};

/**
 * Format price for display
 * @param {number} price - Price in micro units
 * @param {number} tokenType - 0 for ALEO, 1 for USDX
 * @returns {string} Formatted price
 */
export const formatPrice = (price, tokenType = 0) => {
  const value = (price || 0) / 1000000;
  const token = tokenType === 1 ? 'USDX' : 'ALEO';
  return `${value.toFixed(2)} ${token}`;
};

/**
 * Get content type label for display
 * @param {object} post - Post object
 * @returns {string} Content type label
 */
export const getContentTypeLabel = (post) => {
  const quadrant = getQuadrantFromPost(post);
  return quadrant.name;
};

export default {
  VISIBILITY,
  PRICING,
  CONTENT_QUADRANTS,
  getQuadrantId,
  getQuadrant,
  getQuadrantFromPost,
  getQuadrantFilter,
  getAllQuadrants,
  getQuadrantsByPayment,
  getQuadrantsByVisibility,
  formatPrice,
  getContentTypeLabel
};
