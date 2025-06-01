import React from 'react';
import '../../styles/SizingGuide.css';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import PageTitle from '../../common/PageTitle';

const SizingGuide = () => {
  return (
    <div className="sizing-guide-page-container">
      <PageTitle title="Sizing Guide" />
      <Header />
      <main className="sizing-guide-main">
        <section className="sizing-guide-content">
          <h1>What size is right for you?</h1>
          <p>Cakes can be enjoyed in a myriad of ways but cutting them is another story. Our cakes come in 3 distinct shapes: rounds, hearts and squares. They all have their own appeals and can be cut in 2 different ways.<br/>Below is a table of pros and cons for both methods of portioning.</p>
          <div className="sizing-guide-cuts">
            <div className="sizing-guide-cut">
              <h2>Triangle cut:</h2>
              <ul>
                <li><strong>Pros</strong></li>
                <li>Larger Portion sizes</li>
                <li>People get proportional amounts of buttercream per slice</li>
                <li>More aesthetically pleasing</li>
                <li><strong>Cons</strong></li>
                <li>Smaller portion yields</li>
                <li>Mainly effective on round cakes smaller than 10" in diameter</li>
              </ul>
            </div>
            <div className="sizing-guide-cut">
              <h2>Square cut:</h2>
              <ul>
                <li><strong>Pros</strong></li>
                <li>Greater portion yields</li>
                <li>People who aren't fans of buttercream can choose slices with less</li>
                <li>Effective with all cake sizes and shapes</li>
                <li><strong>Cons</strong></li>
                <li>Smaller portion sizes</li>
                <li>Difficult to cut without a cutting board</li>
              </ul>
            </div>
          </div>
          <h2>Portion Guide</h2>
          <p>We have this useful table for how many portions of cake each size and cut yields.</p>
          <table className="sizing-guide-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Triangle cut</th>
                <th>Square cut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>4"</td>
                <td>8</td>
                <td>8</td>
              </tr>
              <tr>
                <td>6"</td>
                <td>12</td>
                <td>14</td>
              </tr>
              <tr>
                <td>8"</td>
                <td>20</td>
                <td>26</td>
              </tr>
              <tr>
                <td>10"</td>
                <td>32</td>
                <td>40</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SizingGuide;
