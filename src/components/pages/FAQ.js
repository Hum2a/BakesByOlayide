import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import '../styles/FAQ.css';

const FAQ = () => (
  <div className="faq-root">
    <Header />
    <div className="faq-hero-section">
      <div className="faq-hero-bgimg-wrap">
        <img 
          src="/images/faq/faq-hero.png" 
          alt="FAQs" 
          className="faq-hero-bgimg" 
        />
        <h1 className="faq-hero-title">FAQs</h1>
      </div>
    </div>
    <main className="faq-main">
      <div className="faq-content">
        <div className="faq-text">
          <p><b>How far in advance should I make my order?</b><br />
          The shortest notice we accept for single-tier celebration cakes is 5 days. Multi-tier celebration cakes require a minimum of 2 weeks' notice. Wedding cakes require a minimum of 8 weeks' notice (including sampling and consultation). Large cupcakes, brownie or cookie orders (greater than 36, fewer than 72 portions) require a minimum of 1 week's notice. Corporate or very large orders (greater than 72 individual portions) require a minimum of 6 weeks' notice.</p>

          <p><b>Do orders require deposits?</b><br />
          Orders valued over £50 require a 50% deposit upon order. Once your deposit is paid, we'll process your order. We'll send you pictures of your order before your pick-up time so allow for any custom changes. When you're happy with everything, you'll pay the second half of your payment via invoice or via contactless.</p>

          <p>Orders will not be accessible to you until the entire payment has been processed and received.</p>

          <p><b>What payment methods do you accept?</b><br />
          We currently accept card, contactless and PayPal.</p>

          <p><b>Do you deliver?</b><br />
          Currently we do not offer delivery outside of postal products, corporate events and weddings. We're working on expanding to deliver to all.</p>

          <p><b>When can I collect my order?</b><br />
          When you commission your bakes, you will be given the option to schedule a pick-up time within our regular open hours. Within 24 hours of your planned pick-up time, you'll get our address. If you cannot attend your scheduled time, you will be contacted when your order is ready alongside our team.</p>

          <p>Our bakery is currently located in a house with step only access. If you need assistance in handling your order with your order, we're happy to help.</p>

          <p><b>Do you make fondant or 3D cakes?</b><br />
          Bakes by Olayide is a fondant-free zone: our founder isn't a fan of it. We don't make realistic cakes either. (There are many great bakers and cake artists who do though!)</p>

          <p><b>Where can I find information on allergens?</b><br />
          You can find information on our handling of allergens <a href="/allergens" className="faq-link">here</a>. We also have a table of all allergens in our bakes <a href="/allergens" className="faq-link">here</a>.</p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default FAQ;
