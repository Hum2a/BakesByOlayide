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
  {
    image: '/images/dandelion.png',
    title: 'What size is right for you?',
    description: "Cakes come in so many shapes and sizes. We have a comprehensive guide for how much cake you'll need.",
    link: '/guides/cake-sizes',
  },
  {
    image: '/images/picnic.png',
    title: 'How to care for your bakes',
    description: "No one likes a dry cake. With our tips you can keep your bakes in good condition for longer.",
    link: '/guides/cake-care',
  },
];

const Guides = () => {
  return (
    <section className="homepage-guides">
      {/* Hero Section */}

      {/* Intro */}
      <div className="guides-intro guides-intro-centered">
        Below we have some useful guides to help you. Whether it be knowing how we handle allergens to how you can keep your cake well for longer, we have our tips here.<br />
        For FAQs, look <a href="/faqs" className="guides-intro-link">here</a>.
      </div>
      {/* Guides Grid: 2x2 */}
      <div className="guides-grid-2x2">
        {[0, 1].map(row => (
          <div className="guides-row" key={row}>
            {[0, 1].map(col => {
              const idx = row * 2 + col;
              const guide = guidesData[idx];
              if (!guide) return null;
              return (
                <div className="guide-card guide-card-left" key={guide.title}>
                  <img src={guide.image} alt={guide.title} />
                  <h3>{guide.title}</h3>
                  <p>{guide.description}</p>
                  <a href={guide.link} className="guide-read-btn guide-read-btn-left">Read More</a>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Guides; 