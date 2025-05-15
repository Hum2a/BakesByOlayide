import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import '../styles/TermsAndConditions.css';

const TermsAndConditions = () => (
  <div className="terms-root">
    <Header />
      <h1 className="terms-title">Terms and Conditions</h1>
    <main className="terms-main">
      <div className="terms-content">
        <p>All products made by us are subject to the following terms and conditions.</p>

        <h2>DEPOSITS</h2>
        <p>
          On orders valued greater than £50, a 50% non-refundable deposit is due on the day you issue the order. This is required to reserve the date for your order.<br /><br />
          If you are collecting your order, the remaining balance of your order can be paid 3 days before your collection date via invoice (compulsory for orders valued greater than £200) or in person via contactless payment. In the case of delivery, the remaining balance must be paid at least 3 days before delivery via invoice.<br /><br />
          In the case of multi-tier and wedding cakes, the remaining balance must be paid one week before collection or delivery via invoice.
        </p>

        <h2>ORDERS & ALTERATIONS</h2>
        <p>
          The shortest notice we accept for single-tier celebration cakes is 5 days. Multi-tier celebration cakes require a minimum of 2 weeks' notice. Wedding cakes require a minimum of 8 weeks' notice (including sampling and consultation). Large cupcake, brownie or cookie orders (greater than 36, fewer than 72 portions) require a minimum of 1 weeks' notice. Corporate or very large orders (greater than 72 individual portions) require a minimum of 6 weeks' notice.<br /><br />
          Any products inspired by a picture or photo of a product produced by another bakery or by AI can only be reproduced by us as an interpretation of the product. It will not be an exact replication of the reference product. Changes to improve structural stability or aesthetics can be made at our discretion. You will be informed of any changes that may be made and will be given time to make changes to the design.<br /><br />
          Changes to the design that change the price of the cake will be effective immediately after they have been made. This may be reflected in the increase or decrease of your remaining balance. No changes to design can be made within 5 days of the date of collection or delivery.
        </p>

        <h2>ALLERGEN POLICY</h2>
        <p>
          Clients are required to notify us of any allergens or dietary restrictions of parties expected to consume any items within their order. Our cakes are made in a kitchen that gluten, eggs, dairy and other common allergens are used. Due to the manufacturing process of many ingredients, it can't be guaranteed that all products are entirely nut free.<br /><br />
          All products listed on our website have their ingredients listed and all common allergens in bold.<br /><br />
          Finished and boxed products are labelled with the ingredients list and allergens in bold. It is your responsibility to have your guests check the label before consumption. We are not liable for any allergic reactions or complications through the consumption of our products.
        </p>

        <h2>NON-EDIBLE DECORATIONS</h2>
        <p>
          Clients will be informed of all inedible cake decorations before they receive their order. These can include cake toppers, ribbons, flowers, cake dowels and cake boards (in multi-tiers). It is the client's responsibility to ensure that non-edible elements of the cakes are removed before serving. We are not liable for any injuries incurred by non-edible decorations.
        </p>

        <h2>COLLECTION</h2>
        <p>
          When clients order, they will be given the option to schedule a collection time within our regular open hours. Within 24 hours of their planned pick-up time, they will be sent the collection address. If clients opt out of choosing a schedule time, they will be contacted when your order is ready alongside the collection address.<br /><br />
          In the event that an order is not picked up by the client on the day of collection, the cake will be held for an additional 24 hours. If the client fails to collect it within the extended deadline, the cake will be sold as slices.<br /><br />
          Once the client's order has left the premises, we are no longer liable for any damage the cake undergoes.
        </p>

        <h2>DELIVERY</h2>
        <p>
          When clients order, they will choose the date and location of delivery. Orders are delivered directly by us. It is recommended that clients schedule deliveries to arrive 3 hours before their cake is needed. This is to ensure that you still receive your orders on time, in spite of traffic or weather conditions.<br /><br />
          Once the client's order arrives at the venue and is accepted, we are no longer liable for any damage to the cake.
        </p>

        <h2>IMAGE PUBLICATION</h2>
        <p>
          We reserve the right to publish any images of products made by us on our website and on social media.
        </p>

        <h2>CANCELLATION & REFUNDS</h2>
        <p>
          If clients cancel an order within 10 days of the order due date, we will cancel the order. If the client has paid the full amount, they will receive a 50% refund. Should a cancellation occur with shorter notice, the client will be subject to a cancellation fee (dependant on the days before the order is due).<br /><br />
          Should clients need to postpone or change the date of their event, the deposit and order can be transferred, assuming the new date is not fully booked. If the new date is fully booked and no other date is appropriate, the order will be cancelled without refund.
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsAndConditions;
