import React from 'react';
import '../styles/GuidesPage.css';

const guidesData = [
  {
    image: '/images/dandelion.png',
    title: 'Have Any Dietary Requirements?',
    description: 'Over 20% of us in the UK have an allergy of some kind. See what we can do for you.',
    link: '/guides/dietary-requirements',
  },
  {
    image: '/images/picnic.png',
    title: 'Planning a Special Occasion?',
    description: "There's no better way to finish a large event than to end it with something sweet.",
    link: '/guides/special-occasions',
  },
];

const HomepageGuides = () => {
  return (
    <section className="homepage-guides-section">
      <h2 className="homepage-guides-title">Guides</h2>
      <div className="homepage-guides-row">
        {guidesData.map((guide) => (
          <div className="homepage-guide-card" key={guide.title}>
            <img src={guide.image} alt={guide.title} className="homepage-guide-img" />
            <h3 className="homepage-guide-card-title">{guide.title}</h3>
            <p className="homepage-guide-card-desc">{guide.description}</p>
            <a href={guide.link} className="homepage-guide-btn">Read More</a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomepageGuides;
