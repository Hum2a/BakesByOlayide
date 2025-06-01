import { doc, setDoc, collection, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

export const saveOrderAndInvoiceToFirebase = async (orderData) => {
  if (!orderData || !orderData.orderId || !orderData.items || !orderData.guestInfo) return;

  try {
    // Prepare order data
    const orderDocData = {
      orderId: orderData.orderId,
      items: orderData.items,
      total: orderData.total,
      guestInfo: orderData.guestInfo,
      createdAt: Timestamp.now(),
      status: orderData.status || 'confirmed',
    };

    // Save order to /orders
    const orderRef = doc(db, 'orders', orderData.orderId);
    await setDoc(orderRef, orderDocData);

    // Optionally, save to user's subcollection if logged in
    if (auth.currentUser) {
      const userOrderRef = doc(db, 'users', auth.currentUser.uid, 'Orders', orderData.orderId);
      await setDoc(userOrderRef, orderDocData);
    }

    // Prepare invoice data
    const invoiceDocData = {
      orderId: orderData.orderId,
      items: orderData.items.map(item => ({
        ...item,
        total: item.price * item.quantity,
      })),
      amount: orderData.total,
      status: 'unpaid',
      createdAt: Timestamp.now(),
      customerEmail: orderData.guestInfo.email,
    };

    // Save invoice to /invoices
    const invoiceRef = doc(collection(db, 'invoices'));
    await setDoc(invoiceRef, invoiceDocData);

    // Optionally, save to user's subcollection if logged in
    if (auth.currentUser) {
      const userInvoiceRef = doc(db, 'users', auth.currentUser.uid, 'Invoices', invoiceRef.id);
      await setDoc(userInvoiceRef, invoiceDocData);
    }

    // Link invoice to order
    await setDoc(orderRef, { invoiceRef: invoiceRef.path }, { merge: true });
    if (auth.currentUser) {
      const userOrderRef = doc(db, 'users', auth.currentUser.uid, 'Orders', orderData.orderId);
      await setDoc(userOrderRef, { invoiceRef: invoiceRef.path }, { merge: true });
    }
  } catch (err) {
    console.error('Error saving order/invoice:', err);
  }
}; 