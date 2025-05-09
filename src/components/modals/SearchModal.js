import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import CakeCard from '../cards/CakeCard';
import '../styles/Modal.css';
import '../styles/SearchBarModal.css';

const SearchModal = ({ isOpen, onClose }) => {
  const [cakes, setCakes] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCakes = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'cakes'));
        const cakesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCakes(cakesData);
        setFiltered(cakesData);
      } catch (err) {
        setCakes([]);
        setFiltered([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCakes();
    if (inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!search) {
      setFiltered(cakes);
    } else {
      setFiltered(
        cakes.filter(cake =>
          cake.name.toLowerCase().includes(search.toLowerCase()) ||
          (cake.description && cake.description.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
  }, [search, cakes]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`searchbar-modal${isOpen ? ' open' : ''}`} ref={containerRef}>
      <div className="searchbar-modal-bar">
        <input
          type="text"
          className="searchbar-modal-input"
          placeholder="Search for cakes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          ref={inputRef}
        />
        <button className="searchbar-modal-close" onClick={onClose}>&times;</button>
      </div>
      <div className="searchbar-modal-results">
        {loading ? (
          <div className="searchbar-modal-loading">Loading cakes...</div>
        ) : filtered.length === 0 ? (
          <div className="searchbar-modal-empty">No cakes found.</div>
        ) : (
          <div className="searchbar-modal-grid">
            {filtered.map(cake => (
              <CakeCard key={cake.id} cake={cake} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal; 