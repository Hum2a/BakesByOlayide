import React from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import '../../styles/PricingGuide.css';

const PricingGuide = () => (
  <div className="pricing-guide-outer">
    <Header />
    <div className="pricing-guide-container">
      <h1 className="pricing-guide-title">Pricing Guide</h1>

      {/* Cupcakes */}
      <section className="pricing-section">
        <h2>Cupcakes</h2>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Flavour</th>
              <th>Single</th>
              <th>Box of 4</th>
              <th>Box of 6</th>
              <th>Box of 12</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Vanilla Sponge</td><td>£3.00</td><td>£11.00</td><td>£15.00</td><td>£25.00</td></tr>
            <tr><td>Chocolate</td><td>£3.00</td><td>£11.00</td><td>£15.00</td><td>£25.00</td></tr>
            <tr><td>Red velvet</td><td>£3.50</td><td>£13.00</td><td>£17.50</td><td>£30.00</td></tr>
            <tr><td>Carrot cake</td><td>£3.50</td><td>£13.00</td><td>£17.50</td><td>£30.00</td></tr>
            <tr><td>Oreo</td><td>£3.50</td><td>£12.00</td><td>£17.50</td><td>£30.00</td></tr>
            <tr><td>Salted Caramel</td><td>£4.00</td><td>£15.00</td><td>£20.00</td><td>£35.00</td></tr>
            <tr><td>Tiramisu</td><td>£4.00</td><td>£15.00</td><td>£20.00</td><td>£35.00</td></tr>
            <tr><td colSpan="5" className="pricing-table-subhead">Seasonal Flavours</td></tr>
            <tr><td>Easter</td><td>£3.25</td><td>£11.00</td><td>£15.00</td><td>£25.00</td></tr>
            <tr><td>Victoria Sponge</td><td>£4.00</td><td>£15.00</td><td>£20.00</td><td>£35.00</td></tr>
            <tr><td>Cinnamon Apple</td><td>£4.00</td><td>£15.00</td><td>£20.00</td><td>£35.00</td></tr>
            <tr><td>Berries and Cream</td><td>£3.50</td><td>£14.00</td><td>£17.50</td><td>£30.00</td></tr>
            <tr><td>WC and Caramel</td><td>£3.50</td><td>£14.00</td><td>£17.50</td><td>£30.00</td></tr>
            <tr><td>Gingerbread</td><td>£3.50</td><td>£14.00</td><td>£17.50</td><td>£30.00</td></tr>
            <tr><td>Caramel Apple</td><td>£4.00</td><td>£15.00</td><td>£20.00</td><td>£35.00</td></tr>
            <tr><td>Forest Fruits</td><td>£4.00</td><td>£15.00</td><td>£20.00</td><td>£35.00</td></tr>
            <tr><td>WC and Raspberry</td><td>£4.00</td><td>£15.00</td><td>£20.00</td><td>£35.00</td></tr>
          </tbody>
        </table>
      </section>

      {/* Miniatures */}
      <section className="pricing-section">
        <h2>Miniatures</h2>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Flavour</th>
              <th>Single</th>
              <th>Box of 4</th>
              <th>Box of 12</th>
              <th>Box of 24</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Vanilla</td><td>£1.25</td><td></td><td></td><td></td></tr>
            <tr><td>Chocolate</td><td>£1.25</td><td></td><td></td><td></td></tr>
            <tr><td>Red Velvet</td><td>£1.50</td><td></td><td></td><td></td></tr>
            <tr><td>Carrot Cake</td><td>£1.50</td><td></td><td></td><td></td></tr>
            <tr><td>Oreo</td><td>£1.50</td><td></td><td></td><td></td></tr>
          </tbody>
        </table>
      </section>

      {/* Large Cakes */}
      <section className="pricing-section">
        <h2>Large Cakes</h2>
        <div className="pricing-note">Starting Prices (shape doesn't change pricing)</div>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Flavour Base</th>
              <th>6"</th>
              <th>8"</th>
              <th>10"</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Vanilla</td><td>£70</td><td>£85</td><td>£110</td></tr>
            <tr><td>Cinnamon Apple</td><td>£75</td><td>£90</td><td>£125</td></tr>
            <tr><td>Blueberry/Lemon</td><td>£75</td><td>£90</td><td>£125</td></tr>
            <tr><td>Chocolate</td><td>£70</td><td>£85</td><td>£110</td></tr>
            <tr><td>*Red velvet</td><td>£80</td><td>£95</td><td>£130</td></tr>
            <tr><td>*Carrot cake</td><td>£80</td><td>£95</td><td>£130</td></tr>
            <tr><td>Oreo</td><td>£75</td><td>£90</td><td>£125</td></tr>
            <tr><td>Gingerbread</td><td>£75</td><td>£90</td><td>£125</td></tr>
            <tr><td>Custom</td><td>£85</td><td>£100</td><td>£130</td></tr>
          </tbody>
        </table>
        <div className="pricing-note">
          All cakes are priced assuming the buttercream accompanying it is vanilla American buttercream. Those with Asterisks are priced as if with Cream Cheese Buttercream.<br/>
          All prices are inclusive of a generic birthday cake topper, cake board and a box.
        </div>
      </section>

      {/* Add Ons - Icings */}
      <section className="pricing-section">
        <h2>Add Ons: Icings</h2>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Icing Type</th>
              <th>6"</th>
              <th>8"</th>
              <th>10"</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Vanilla Whipped Cream</td><td>£5</td><td>£9</td><td>£15</td></tr>
            <tr><td>Vanilla Buttercream</td><td>N/A</td><td>N/A</td><td>N/A</td></tr>
            <tr><td>Chocolate Buttercream</td><td>£3</td><td>£5</td><td>£9</td></tr>
            <tr><td>White Chocolate and Vanilla Bean</td><td>£4</td><td>£7</td><td>£12</td></tr>
            <tr><td>Cream Cheese Buttercream</td><td>£4</td><td>£7</td><td>£12</td></tr>
            <tr><td>Whipped Ganache</td><td>£8</td><td>£10</td><td>£18</td></tr>
            <tr><td>Salted Caramel Buttercream</td><td>£4</td><td>£7</td><td>£12</td></tr>
            <tr><td>Meringue Buttercream</td><td>£8</td><td>£12</td><td>£20</td></tr>
          </tbody>
        </table>
        <div className="pricing-note">
          For cakes that use multiple Icings (only available in cakes 8" or larger), charge half the second amount. This does not apply for multi-tier cakes.
        </div>
      </section>

      {/* Add Ons - Fillings */}
      <section className="pricing-section">
        <h2>Add Ons: Fillings</h2>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Filling Type</th>
              <th>6"</th>
              <th>8"</th>
              <th>10"</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Ganache</td><td>£3</td><td>£5</td><td>£9</td></tr>
            <tr><td>Jams</td><td>£3</td><td>£5</td><td>£9</td></tr>
            <tr><td>Caramel Sauce</td><td>£4</td><td>£7</td><td>£12</td></tr>
            <tr><td>Fruit Compote</td><td>£3</td><td>£5</td><td>£9</td></tr>
            <tr><td>Fruit Coulis</td><td>£3</td><td>£5</td><td>£9</td></tr>
            <tr><td>Coffee Cream</td><td>£5</td><td>£9</td><td>£15</td></tr>
            <tr><td>*Biscoff Cream</td><td>£5</td><td>£9</td><td>£15</td></tr>
            <tr><td>*Cheesecake</td><td>£7</td><td>£11</td><td>£17</td></tr>
            <tr><td>Stewed Apple</td><td>£5</td><td>£9</td><td>£15</td></tr>
            <tr><td>Fresh Fruit</td><td>£8</td><td>£12</td><td>£20</td></tr>
          </tbody>
        </table>
        <div className="pricing-note">
          For cakes that use multiple Icings (only available in cakes 8" or larger), charge half the second amount. This does not apply for multi-tier cakes.
        </div>
      </section>

      {/* Add Ons - Toppings */}
      <section className="pricing-section">
        <h2>Add Ons: Toppings</h2>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Topping Type</th>
              <th>6"</th>
              <th>8"</th>
              <th>10"</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Chocolate Ganache drip</td><td>£3</td><td>£5</td><td>£9</td></tr>
            <tr><td>Lotus Biscoff</td><td>£3</td><td>£5</td><td>£9</td></tr>
            <tr><td>Oreos</td><td>£5</td><td>£9</td><td>£15</td></tr>
            <tr><td>Meringues</td><td>£5</td><td>£9</td><td>£15</td></tr>
            <tr><td>Macarons</td><td>£7</td><td>£11</td><td>£17</td></tr>
            <tr><td>Fresh Fruit</td><td>£8</td><td>£12</td><td>£20</td></tr>
          </tbody>
        </table>
      </section>

      {/* Cake Toppers */}
      <section className="pricing-section">
        <h2>Cake Toppers</h2>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Cake Topper</th>
              <th>Material</th>
              <th>Additional Price</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Generic Birthday A</td><td>Acrylic</td><td>None</td></tr>
            <tr><td>Generic Birthday B</td><td>Paper</td><td>None</td></tr>
            <tr><td>Specific Age 1</td><td>Acrylic</td><td>£5</td></tr>
            <tr><td>Specific Age 2</td><td>Paper</td><td>£3</td></tr>
            <tr><td>Valentine's</td><td>Acrylic</td><td>£5</td></tr>
            <tr><td>Mother's Day</td><td>Acrylic</td><td>£5</td></tr>
            <tr><td>Eid</td><td>Paper</td><td>£3</td></tr>
            <tr><td>Easter</td><td>Acrylic</td><td>£5</td></tr>
            <tr><td>Father's Day</td><td>Acrylic</td><td>£5</td></tr>
            <tr><td>Halloween</td><td>Paper</td><td>£3</td></tr>
            <tr><td>Christmas</td><td>Paper</td><td>£3</td></tr>
            <tr><td>Custom A</td><td>Acrylic</td><td>£10</td></tr>
            <tr><td>Custom B</td><td>Paper</td><td>£7</td></tr>
          </tbody>
        </table>
        <div className="pricing-note">
          This does not include wedding cake toppers.
        </div>
      </section>
    </div>
    <Footer />
  </div>
);

export default PricingGuide;
