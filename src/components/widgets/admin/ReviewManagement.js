import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, getDocs, doc, deleteDoc, orderBy, where, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { FaStar, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';
import '../../styles/ReviewManagement.css';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newReview, setNewReview] = useState({
    productId: '',
    userName: '',
    rating: 5,
    review: '',
    verifiedPurchase: true,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0,5)
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await fetchProducts();
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to initialize data');
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      fetchReviews();
    }
  }, [products]);

  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'cakes');
      const productsSnapshot = await getDocs(productsRef);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      throw error;
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let allReviews = [];

      for (const product of products) {
        const reviewsRef = collection(db, 'cakes', product.id, 'reviews');
        const reviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        const productReviews = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          productId: product.id,
          productName: product.name,
          ...doc.data()
        }));
        
        allReviews = [...allReviews, ...productReviews];
      }

      // Sort reviews based on current sort settings
      const sortedReviews = sortReviews(allReviews);
      setReviews(sortedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const sortReviews = (reviewsToSort) => {
    return reviewsToSort.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case 'rating':
          comparison = b.rating - a.rating;
          break;
        case 'product':
          comparison = a.productName.localeCompare(b.productName);
          break;
        default:
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  };

  const handleDeleteReview = async (productId, reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteDoc(doc(db, 'cakes', productId, 'reviews', reviewId));
        setReviews(reviews.filter(review => review.id !== reviewId));
      } catch (error) {
        console.error('Error deleting review:', error);
        setError('Failed to delete review');
      }
    }
  };

  const handleCreateReview = async (e) => {
    e.preventDefault();
    try {
      if (!newReview.productId || !newReview.userName || !newReview.review) {
        alert('Please fill in all required fields');
        return;
      }

      const selectedProduct = products.find(p => p.id === newReview.productId);
      const reviewsRef = collection(db, 'cakes', newReview.productId, 'reviews');
      
      const [year, month, day] = newReview.date.split('-').map(Number);
      const [hours, minutes] = newReview.time.split(':').map(Number);
      const reviewDate = new Date(year, month - 1, day, hours, minutes);
      
      await addDoc(reviewsRef, {
        userName: newReview.userName,
        rating: newReview.rating,
        review: newReview.review,
        verifiedPurchase: newReview.verifiedPurchase,
        createdAt: Timestamp.fromDate(reviewDate)
      });

      setNewReview({
        productId: '',
        userName: '',
        rating: 5,
        review: '',
        verifiedPurchase: true,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0,5)
      });
      setShowCreateForm(false);
      fetchReviews();
    } catch (error) {
      console.error('Error creating review:', error);
      setError('Failed to create review');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={`star ${index < rating ? 'filled' : ''}`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = (
      review.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesProduct = selectedProduct === 'all' || review.productId === selectedProduct;
    
    return matchesSearch && matchesProduct;
  });

  const renderCreateForm = () => (
    <div className="create-review-form">
      <h3>Create New Review</h3>
      <form onSubmit={handleCreateReview}>
        <div className="form-group">
          <label>Product</label>
          <select
            value={newReview.productId}
            onChange={(e) => setNewReview({ ...newReview, productId: e.target.value })}
            required
          >
            <option value="">Select a product</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Reviewer Name</label>
          <input
            type="text"
            value={newReview.userName}
            onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
            placeholder="Enter reviewer name"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group date-time">
            <label>Review Date</label>
            <input
              type="date"
              value={newReview.date}
              onChange={(e) => setNewReview({ ...newReview, date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group date-time">
            <label>Review Time</label>
            <input
              type="time"
              value={newReview.time}
              onChange={(e) => setNewReview({ ...newReview, time: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Rating</label>
          <div className="rating-input">
            {[...Array(5)].map((_, index) => (
              <FaStar
                key={index}
                className={`star ${index < newReview.rating ? 'filled' : ''}`}
                onClick={() => setNewReview({ ...newReview, rating: index + 1 })}
              />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Review Text</label>
          <textarea
            value={newReview.review}
            onChange={(e) => setNewReview({ ...newReview, review: e.target.value })}
            placeholder="Write your review here..."
            required
            rows={4}
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={newReview.verifiedPurchase}
              onChange={(e) => setNewReview({ ...newReview, verifiedPurchase: e.target.checked })}
            />
            Mark as Verified Purchase
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">Create Review</button>
          <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  if (loading) {
    return (
      <div className="reviews-loading">
        <div className="loading-spinner"></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reviews-error">
        <p>{error}</p>
        <button onClick={fetchReviews}>Retry</button>
      </div>
    );
  }

  return (
    <div className="review-management">
      <div className="review-management-header">
        <div className="header-top">
          <h2>Review Management</h2>
          <button
            className="create-review-btn"
            onClick={() => setShowCreateForm(true)}
          >
            <FaPlus /> Create Review
          </button>
        </div>
        <div className="review-controls">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="product-filter"
          >
            <option value="all">All Products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
              <option value="product">Sort by Product</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {showCreateForm && renderCreateForm()}

      <div className="reviews-stats">
        <div className="stat-card">
          <h3>Total Reviews</h3>
          <p>{reviews.length}</p>
        </div>
        <div className="stat-card">
          <h3>Average Rating</h3>
          <p>
            {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0).toFixed(1)}
            <span className="star filled">★</span>
          </p>
        </div>
        <div className="stat-card">
          <h3>Products Reviewed</h3>
          <p>{new Set(reviews.map(review => review.productId)).size}</p>
        </div>
      </div>

      <div className="reviews-list">
        {filteredReviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews found</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="review-info">
                  <h3 className="product-name">{review.productName}</h3>
                  <div className="reviewer-details">
                    <span className="reviewer-name">{review.userName}</span>
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                <div className="review-actions">
                  <div className="rating">{renderStars(review.rating)}</div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteReview(review.productId, review.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              {review.review && (
                <p className="review-text">{review.review}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewManagement; 