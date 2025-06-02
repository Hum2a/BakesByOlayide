import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { FaCalendarAlt, FaLock, FaUnlock, FaInfoCircle, FaExclamationTriangle, FaCheck, FaClock } from 'react-icons/fa';
import '../../styles/BlockedDatesManager.css';

const BlockedDatesManager = () => {
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [view, setView] = useState('calendar');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  const availableTimes = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 9;
    return [`${hour}:00`, `${hour}:30`];
  }).flat();

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    try {
      const blockedDatesRef = collection(db, 'blockedDates');
      const snapshot = await getDocs(blockedDatesRef);
      const dates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBlockedDates(dates);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      setLoading(false);
    }
  };

  const getDatesForMonth = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const availableDates = getDatesForMonth(displayedMonth);

  const isDateBlocked = (date) => {
    return blockedDates.some(blocked => 
      new Date(blocked.date).toDateString() === date.toDateString()
    );
  };

  const isTimeBlocked = (date, time) => {
    return blockedDates.some(blocked => 
      new Date(blocked.date).toDateString() === date.toDateString() &&
      blocked.blockedTimes?.includes(time)
    );
  };

  const isDateSelected = (date) => {
    return selectedDates.some(selected => 
      selected.toDateString() === date.toDateString()
    );
  };

  const handleDateSelect = (date) => {
    if (multiSelectMode) {
      setSelectedDates(prev => {
        const dateStr = date.toDateString();
        const isSelected = prev.some(d => d.toDateString() === dateStr);
        if (isSelected) {
          return prev.filter(d => d.toDateString() !== dateStr);
        } else {
          return [...prev, date];
        }
      });
    } else {
      setSelectedDates([date]);
      setShowTimeSelector(true);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTimes(prev => {
      if (prev.includes(time)) {
        return prev.filter(t => t !== time);
      } else {
        return [...prev, time];
      }
    });
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0 || !reason.trim()) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    setSaveStatus('saving');
    try {
      const promises = selectedDates.map(async (date) => {
        const dateId = date.toISOString().split('T')[0];
        const blockedDateRef = doc(db, 'blockedDates', dateId);
        
        await setDoc(blockedDateRef, {
          date: date.toISOString(),
          reason: reason.trim(),
          blockedTimes: selectedTimes,
          createdAt: new Date().toISOString()
        });
      });

      await Promise.all(promises);
      await fetchBlockedDates();
      setSaveStatus('success');
      setSelectedDates([]);
      setSelectedTimes([]);
      setReason('');
      setMultiSelectMode(false);
      setShowTimeSelector(false);
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error blocking dates:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleUnblockDate = async (dateId) => {
    try {
      await deleteDoc(doc(db, 'blockedDates', dateId));
      await fetchBlockedDates();
      setSelectedDates([]);
      setSelectedTimes([]);
      setReason('');
    } catch (error) {
      console.error('Error unblocking date:', error);
    }
  };

  const handleUnblockTime = async (dateId, time) => {
    try {
      const dateRef = doc(db, 'blockedDates', dateId);
      const dateDoc = await getDoc(dateRef);
      if (dateDoc.exists()) {
        const data = dateDoc.data();
        const updatedTimes = data.blockedTimes.filter(t => t !== time);
        if (updatedTimes.length === 0) {
          // If no times left, delete the entire date
          await deleteDoc(dateRef);
        } else {
          // Otherwise, update the times
          await setDoc(dateRef, { ...data, blockedTimes: updatedTimes });
        }
        await fetchBlockedDates();
      }
    } catch (error) {
      console.error('Error unblocking time:', error);
    }
  };

  const goToPrevMonth = () => {
    setDisplayedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setDisplayedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthName = displayedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const formatDatesByWeekMondayStart = (dates) => {
    const weeks = [];
    let currentWeek = [];
    if (dates.length === 0) return weeks;
    const firstDate = new Date(dates[0]);
    let dayOfWeek = firstDate.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push(null);
    }
    dates.forEach((date) => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(date);
    });
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
    return weeks;
  };

  if (loading) {
    return (
      <div className="blocked-dates-manager">
        <div className="loading-spinner"></div>
        <p>Loading blocked dates...</p>
      </div>
    );
  }

  const datesByWeek = formatDatesByWeekMondayStart(availableDates);

  return (
    <div className="blocked-dates-manager">
      <div className="manager-header">
        <h2><FaCalendarAlt /> Blocked Dates Manager</h2>
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
          >
            <FaCalendarAlt /> Calendar View
          </button>
          <button 
            className={`toggle-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <FaLock /> List View
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="calendar-section">
          <div className="calendar-header">
            <div className="calendar-month-nav">
              <button type="button" onClick={goToPrevMonth} aria-label="Previous Month">&lt;</button>
              <span className="calendar-month-name">{monthName}</span>
              <button type="button" onClick={goToNextMonth} aria-label="Next Month">&gt;</button>
            </div>
            <div className="calendar-legend">
              <span className="legend-item"><span className="legend-color available"></span> Available</span>
              <span className="legend-item"><span className="legend-color blocked"></span> Blocked</span>
              <span className="legend-item"><span className="legend-color selected"></span> Selected</span>
            </div>
          </div>

          <div className="calendar-controls">
            <button
              className={`multi-select-btn ${multiSelectMode ? 'active' : ''}`}
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                if (!multiSelectMode) {
                  setSelectedDates([]);
                  setSelectedTimes([]);
                }
              }}
            >
              <FaCheck /> {multiSelectMode ? 'Exit Multi-Select' : 'Multi-Select Mode'}
            </button>
            {selectedDates.length > 0 && (
              <span className="selected-count">
                {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          <div className="weekday-header">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <div key={day} className="weekday-name">{day}</div>
            ))}
          </div>

          <div className="calendar-month">
            {datesByWeek.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week">
                {week.map((date, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`calendar-day${date ? '' : ' empty'}${date && isDateBlocked(date) ? ' blocked' : ''}${date && isDateSelected(date) ? ' selected' : ''}`}
                    onClick={() => date && !isDateBlocked(date) && handleDateSelect(date)}
                  >
                    {date ? date.getDate() : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="blocked-dates-list">
          <div className="list-header">
            <h3>Currently Blocked Dates</h3>
            <div className="list-actions">
              <button 
                className="add-block-btn"
                onClick={() => {
                  setView('calendar');
                  setSelectedDates([new Date()]);
                  setShowTimeSelector(true);
                }}
              >
                <FaLock /> Block New Date
              </button>
            </div>
          </div>
          
          {blockedDates.length === 0 ? (
            <div className="no-dates">
              <FaInfoCircle />
              <p>No dates are currently blocked</p>
            </div>
          ) : (
            <div className="blocked-dates-grid">
              {blockedDates.map(blocked => (
                <div key={blocked.id} className="blocked-date-item">
                  <div className="blocked-date-info">
                    <span className="blocked-date">
                      {new Date(blocked.date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="blocked-reason">{blocked.reason}</span>
                    {blocked.blockedTimes && blocked.blockedTimes.length > 0 && (
                      <div className="blocked-times">
                        <FaClock /> Blocked Times:
                        <div className="time-chips">
                          {blocked.blockedTimes.map(time => (
                            <span key={time} className="time-chip">
                              {time}
                              <button
                                className="unblock-time-btn"
                                onClick={() => handleUnblockTime(blocked.id, time)}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className="unblock-button"
                    onClick={() => handleUnblockDate(blocked.id)}
                  >
                    <FaUnlock /> Unblock All
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedDates.length > 0 && (
        <div className="date-actions">
          <div className="action-header">
            <h3>
              {selectedDates.length === 1 ? (
                <><FaLock /> Block Date</>
              ) : (
                <><FaLock /> Block {selectedDates.length} Dates</>
              )}
            </h3>
          </div>
          
          <div className="form-group">
            <label htmlFor="reason">
              <FaInfoCircle /> Reason for Blocking:
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for blocking these dates (e.g., Holiday, Maintenance, etc.)"
              required
            />
          </div>

          <div className="time-selector">
            <label>
              <FaClock /> Select Times to Block:
            </label>
            <div className="time-grid">
              {availableTimes.map(time => (
                <button
                  key={time}
                  className={`time-option ${selectedTimes.includes(time) ? 'selected' : ''}`}
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <button
              className={`block-button ${saveStatus}`}
              onClick={handleBlockDates}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'success' ? 'Saved!' :
               saveStatus === 'error' ? 'Error' :
               <><FaLock /> Block {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''}</>}
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setSelectedDates([]);
                setSelectedTimes([]);
                setReason('');
                setMultiSelectMode(false);
                setShowTimeSelector(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedDatesManager; 