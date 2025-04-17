import React, { useState } from 'react';
import { FaTimes, FaStar } from 'react-icons/fa';
import { db, auth } from '../../firebase/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import '../styles/ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, item, orderId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        itemId: item.id,
        itemName: item.name,
        rating,
        review: review.trim(),
        orderId,
        createdAt: new Date().toISOString(),
      };

      // Add review to the cake's reviews collection
      const reviewRef = collection(db, 'cakes', item.id, 'reviews');
      await addDoc(reviewRef, reviewData);

      // Update the cake's average rating
      // You might want to use a Cloud Function for this in production
      // For now, we'll just add the review
      
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content review-modal">
        <div className="review-modal-header">
          <h2>Write a Review</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="review-modal-body">
          <div className="reviewed-item">
            <img src={item.image} alt={item.name} />
            <h3>{item.name}</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rating-input">
              <label>Rating</label>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`star ${
                      star <= (hoverRating || rating) ? 'active' : ''
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
            </div>

            <div className="review-input">
              <label htmlFor="review">Your Review</label>
              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review here..."
                rows={4}
              />
            </div>

            {error && <div className="review-error">{error}</div>}

            <div className="review-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal; 