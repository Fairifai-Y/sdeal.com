import React, { useState, useEffect } from 'react';
import './FairifaiBadge.css';

const FairifaiBadge = () => {
  const [badgeData, setBadgeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBadgeData = async () => {
      try {
        const response = await fetch('https://fairifai.com/api/badge/sdeal.com');
        if (!response.ok) {
          throw new Error('Failed to fetch badge data');
        }
        const data = await response.json();
        setBadgeData(data);
      } catch (err) {
        console.error('Error loading Fairifai badge:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeData();
  }, []);

  if (loading) {
    return (
      <div className="fairifai-badge-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !badgeData) {
    return null; // Don't show anything if there's an error
  }

  return (
    <a 
      href="https://fairifai.com/site/sdeal.com/review" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fairifai-badge-link"
    >
      <div className="fairifai-badge">
        <span className="star-icon">⭐</span>
        <span className="rating">{badgeData.averageRating}/5</span>
        <span className="reviews">({badgeData.totalReviews} reviews)</span>
      </div>
    </a>
  );
};

export default FairifaiBadge;
