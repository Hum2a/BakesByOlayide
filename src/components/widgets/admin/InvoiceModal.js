import React, { useEffect, useState } from 'react';
import { doc, getDoc, DocumentReference } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import '../../styles/OrderManagement.css';

const InvoiceModal = ({ isOpen, onClose, invoiceUrl: invoiceRef }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !invoiceRef) return;
    setLoading(true);
    setError('');
    setInvoice(null);
    const fetchInvoice = async () => {
      try {
        let ref = invoiceRef;
        // If it's a string, convert to DocumentReference
        if (typeof invoiceRef === 'string') {
          ref = doc(db, invoiceRef);
        }
        console.log('InvoiceRef:', ref);
        const invoiceDoc = await getDoc(ref);
        if (invoiceDoc.exists()) {
          setInvoice(invoiceDoc.data());
        } else {
          setError('Invoice not found.');
        }
      } catch (err) {
        setError('Failed to fetch invoice.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [isOpen, invoiceRef]);

  if (!isOpen) return null;

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal-content">
        <button className="invoice-modal-close" onClick={onClose}>&times;</button>
        <h2 className="invoice-modal-title">Invoice</h2>
        <div className="invoice-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
          ) : error ? (
            <div style={{ color: '#e74c3c', padding: '2rem', textAlign: 'center' }}>{error}</div>
          ) : invoice ? (
            <div className="invoice-details">
              <div className="invoice-row"><strong>Invoice ID:</strong> {invoice.id}</div>
              <div className="invoice-row"><strong>Status:</strong> {invoice.status}</div>
              <div className="invoice-row"><strong>Order ID:</strong> {invoice.orderId}</div>
              <div className="invoice-row"><strong>Payment ID:</strong> {invoice.paymentId}</div>
              <div className="invoice-row"><strong>Payment Method:</strong> {invoice.paymentMethod}</div>
              <div className="invoice-row"><strong>Created At:</strong> {invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleString() : String(invoice.createdAt)}</div>
              <div className="invoice-row"><strong>Amount:</strong> £{(invoice.amount).toFixed(2)}</div>
              <div className="invoice-row"><strong>Items:</strong></div>
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>£{(item.price / 100).toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td>£{(item.total / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: '#e74c3c', padding: '2rem', textAlign: 'center' }}>No invoice available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal; 