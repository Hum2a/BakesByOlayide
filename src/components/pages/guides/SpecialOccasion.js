import React from 'react';
import '../../styles/SpecialOccasion.css';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import PageTitle from '../../common/PageTitle';

const SpecialOccasion = () => {
  return (
    <div className="special-occasion-page-container">
      <PageTitle title="Special Occasions" />
      <Header />
      <main className="special-occasion-main">
        <section className="special-occasion-content">
          <h1>Planning for a Special Occasion?</h1>
          <p>Large event planning can be stressful- even with a professional planner by your side. Here at Bakes by Olayide, we want to help alleviate any sugar-related stress by streamlining the process for you.</p>
          <p>For party planners, we offer a sampler set of cakes for you to try during a private consultation. In this consultation you'll be advised and offered ideas for designs and themes to line up with your day and story. We'll inform you of everything we can do for you and your guests and we'll handle delivery on the day.</p>
          <p>To start planning your event's cakes and bakes, contact us here.</p>
          <p>If you're looking for multi-tier cakes or number/letter cakes, reach out here.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SpecialOccasion;
