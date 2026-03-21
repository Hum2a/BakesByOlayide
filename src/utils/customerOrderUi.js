import React from 'react';
import { FaClock, FaBox, FaTruck, FaTimes, FaCheckCircle } from 'react-icons/fa';

/** Shared date formatting for Firestore / ISO timestamps on customer-facing order UIs */
export function formatOrderTimestamp(timestamp) {
  if (!timestamp) return { date: '—', time: '' };
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    return { date: '—', time: '' };
  }
  if (Number.isNaN(date.getTime())) {
    return { date: '—', time: '' };
  }
  return {
    date: date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

/**
 * Labels aligned with admin order workflow (enquiry → confirm → ready → complete).
 * Returns { label, className, icon } for customer account / history views.
 */
export function getCustomerOrderStatusPresentation(status) {
  const s = (status || 'pending').toLowerCase();
  switch (s) {
    case 'pending':
    case 'unpaid':
    case 'incomplete':
      return {
        label: 'Awaiting approval',
        className: 'account-order-status--pending',
        icon: <FaClock />,
      };
    case 'confirmed':
    case 'paid':
      return {
        label: 'Confirmed',
        className: 'account-order-status--confirmed',
        icon: <FaCheckCircle />,
      };
    case 'ready':
      return {
        label: 'Ready for pickup',
        className: 'account-order-status--ready',
        icon: <FaTruck />,
      };
    case 'completed':
      return {
        label: 'Completed',
        className: 'account-order-status--completed',
        icon: <FaBox />,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'account-order-status--cancelled',
        icon: <FaTimes />,
      };
    default:
      return {
        label: 'Processing',
        className: 'account-order-status--pending',
        icon: <FaClock />,
      };
  }
}

export function canWriteReviewForOrder(status) {
  const s = (status || '').toLowerCase();
  return ['confirmed', 'paid', 'ready', 'completed'].includes(s);
}
