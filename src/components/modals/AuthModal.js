import React, { useState } from 'react';
import { FaTimes, FaGoogle } from 'react-icons/fa';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider, db } from '../../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import '../styles/AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user profile document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          role: 'user',
          isAdmin: false,
          isDeveloper: false,
          orders: [],
          cart: [],
          wishlist: [],
          profilePicture: '',
          bio: '',
          location: '',
          website: '',
          socialMedia: [],
        });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Create or update user profile document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }, { merge: true });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="auth-modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        <div className="auth-modal-header">
          <h2>{showForgotPassword ? 'Reset Password' : isLogin ? 'Login' : 'Register'}</h2>
          {!showForgotPassword && (
            <button 
              className="auth-toggle-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </button>
          )}
        </div>
        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="auth-form">
            {resetMessage && <div className="auth-error" style={{ color: 'green', background: '#e8f5e9' }}>{resetMessage}</div>}
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-input-group">
              <label htmlFor="resetEmail">Email</label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetMessage('');
                setError('');
              }}
              style={{ marginTop: '0.5rem' }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="auth-input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {!isLogin && (
              <div className="auth-input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}
            {isLogin && (
              <button
                type="button"
                className="auth-toggle-btn"
                style={{ textAlign: 'right', marginBottom: '0.5rem' }}
                onClick={() => {
                  setShowForgotPassword(true);
                  setError('');
                  setResetMessage('');
                }}
              >
                Forgot Password?
              </button>
            )}
            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <FaGoogle /> Continue with Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal; 