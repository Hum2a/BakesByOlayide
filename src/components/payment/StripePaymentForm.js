import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './StripePaymentForm.css';

const StripePaymentForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('new');
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!auth.currentUser) {
        setLoadingPaymentMethods(false);
        return;
      }

      setLoadingPaymentMethods(true);
      try {
        const paymentDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'Settings', 'payment'));
        if (paymentDoc.exists()) {
          const paymentData = paymentDoc.data();
          const savedCards = paymentData.savedCards || [];
          setSavedPaymentMethods(savedCards);
          
          // Only set selected payment method to default if there are saved cards
          if (savedCards.length > 0 && paymentData.defaultPaymentMethod) {
            setSelectedPaymentMethod(paymentData.defaultPaymentMethod);
          }
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const savePaymentMethod = async (paymentMethod) => {
    if (!auth.currentUser) return;

    try {
      const { card } = paymentMethod;
      const newCard = {
        id: paymentMethod.id,
        type: 'card',
        cardNumber: `****${card.last4}`,
        brand: card.brand,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        cardholderName: paymentMethod.billing_details.name,
        stripePaymentMethodId: paymentMethod.id,
        addedAt: new Date().toISOString()
      };

      const paymentDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'Settings', 'payment'));
      const currentData = paymentDoc.exists() ? paymentDoc.data() : { savedCards: [] };
      
      const updatedCards = [...currentData.savedCards, newCard];
      
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'Settings', 'payment'), {
        ...currentData,
        savedCards: updatedCards,
        defaultPaymentMethod: currentData.defaultPaymentMethod || paymentMethod.id
      }, { merge: true });

      setSavedPaymentMethods(updatedCards);
      return newCard;
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      let paymentMethodId;

      if (selectedPaymentMethod === 'new') {
        // Create a new payment method
        const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: elements.getElement(CardElement),
        });

        if (createError) {
          throw new Error(createError.message);
        }

        paymentMethodId = paymentMethod.id;

        // Save the payment method if requested
        if (saveCard && auth.currentUser) {
          await savePaymentMethod(paymentMethod);
        }
      } else {
        // Use existing payment method
        const savedMethod = savedPaymentMethods.find(method => method.id === selectedPaymentMethod);
        if (!savedMethod) {
          throw new Error('Selected payment method not found');
        }
        paymentMethodId = savedMethod.stripePaymentMethodId;
      }

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount,
          payment_method_id: paymentMethodId
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: paymentMethodId,
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setErrorMessage(err.message);
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const showNewCardInput = selectedPaymentMethod === 'new';
  const showSavedCards = savedPaymentMethods.length > 0;

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {auth.currentUser && (
        <div className="save-card-option">
          <label>
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
            />
            Save card for future payments
          </label>
        </div>
      )}
      
      {errorMessage && (
        <div className="stripe-error">
          {errorMessage}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="stripe-submit-button"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

export default StripePaymentForm; 