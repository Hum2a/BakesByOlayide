import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import '../styles/TermsAndConditions.css';

const TermsAndConditions = () => (
  <div className="terms-root">
    <PageTitle title="Terms and Conditions" />
    <Header />
      <h1 className="terms-title">Terms and Conditions</h1>
    <main className="terms-main">
      <div className="terms-content">
        <p>All products made by us are subject to the following terms and conditions.</p>

        <h2>DEPOSITS</h2>
        <p>For orders made via enquiry (larger than order maximums, unconventional cake orders or multi-tiers), a 50% non-refundable deposit is due within <strong>2</strong> days of the order. The order is not confirmed until the deposit has been paid.</p>
        <ul className="deposits-list">
          <li>The remaining balance is to be paid:</li>
          <li>Up to <strong>7 days</strong> prior to the date of collection via invoice,</li>
          <li>Or on the day of collection via payment terminal.</li>
        </ul>
        <p>In the case of delivery, the remaining balance must be paid at least <strong>7 days</strong> before the delivery date.</p>

        <h2>ORDERS & ALTERATIONS</h2>
        <p>
          All items available on the website can be fulfilled within <strong>4 days</strong> of ordering.<br /><br />
          Enquiry only orders (larger than order maximums, multi-tiers or number/letter cakes) require a minimum notice of <strong>2 weeks</strong> or such other period as may be agreed between the client and us.<br /><br />
          Orders related to weddings with consultations require a minimum of <strong>6 weeks</strong>’ notice. This includes sampling and consultation, alongside finalising designs and delivery of said cake.<br /><br />
          Any products inspired by a picture or photo of a product produced by another bakery or by AI can only be reproduced by us as an interpretation of the product. It will not be an exact replication of the reference product.<br /><br />
          Changes to improve structural stability or aesthetics can be made at our discretion. You will be informed of any changes that may be made and will be given time to make alterations to the design.<br /><br />
          Changes to the design that alter the price of the cake(s) will be effective immediately. These changes may result in an increase or decrease of the price. No changes to design can be made within <strong>2 days</strong> of the date of collection or delivery.
        </p>

        <h2>ALLERGEN POLICY</h2>
        <p>
          Clients are required to notify us of any allergens or dietary restrictions of parties expected to consume any items within their order. Our cakes are made in a kitchen that gluten, eggs, dairy and other common allergens are used. Due to the manufacturing process of many ingredients, it can’t be guaranteed that all products are entirely nut free.<br /><br />
          All products listed on our website have their ingredients listed and all common allergens in bold. <br /><br />
          Finished and boxed products are labelled with the ingredients list and allergens in bold. It is your responsibility to have your guests check the label before consumption. We are not liable for any allergic reactions or complications through the consumption of our products.
        </p>

        <h2>NON-EDIBLE DECORATIONS</h2>
        <p>
          Clients will be informed of all non-edible cake decorations before they receive their order. These can include cake toppers, ribbons, flowers, cake dowels and cake boards (in multi-tiers). It is the client's responsibility to ensure that the non-edible elements of the cakes are removed before serving. We are not liable for any injuries incurred by consuming non-edible decorations.
        </p>

        <h2>COLLECTION</h2>
        <p>
        When clients order, they will be given the option to schedule a collection time within our regular open hours. Within 24 hours of their planned pick-up time, they will be sent the collection address. If clients opt out of choosing a schedule time, they will be contacted when your order is ready alongside the collection address.
        In the event that an order is not picked up by the client on the day of collection, the cake will be held for an additional 24 hours. If the client fails to collect it within the extended deadline, the cake will be disposed of.
        Once the client’s order has left the premises, we are no longer liable for any damage to the cake(s).
        </p>

        <h2>DELIVERY</h2>
        <p>
        When clients order, they will choose the date and location of delivery. Orders are delivered directly by us. It is recommended that clients schedule deliveries to arrive at least 3 hours before their cake is needed. This is to ensure that you still receive your orders on time, in spite of traffic or weather conditions.<br /><br />
        Once the client’s order arrives at the venue and is accepted, we are no longer liable for any damage to the cake(s).
        </p>

        <h2>IMAGE PUBLICATION</h2>
        <p>
          We reserve the right to publish any images of products made by us on our website and on social media.
        </p>

        <h2>CANCELLATION & REFUNDS</h2>
        <p>
        If clients cancel an order within 10 days of the order due date, the order shall be deemed to be cancelled and a refund will be processed as described herein. If the client has paid the full amount, they will receive a full refund. Should a cancellation occur with shorter notice, the client will be subject to a cancellation fee (dependant on the days before the order is due).<br /><br />
        Should clients need to postpone or change the date of their event, the deposit (if applicable) and order can be transferred, assuming the new date is not fully booked. If the new date is fully booked and no other date is appropriate, the order will be cancelled and the client will receive a refund subject to a cancellation fee (dependant on the days before the order is due).
        </p>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsAndConditions;
