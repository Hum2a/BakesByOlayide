import React from 'react';
import '../styles/AboutUsPage.css';
import Header from '../common/Header';
import Footer from '../common/Footer';

const AboutUsPage = () => {
  return (
    <div className="aboutus-page-container">
      <Header />
      <main className="aboutus-main">
        <section className="aboutus-content">
          <h1>About Us</h1>
          <p>Covid-19 changed the world on a scale that no one could have predicted: the world shutdown and we spent weeks isolating from each other in a way that humanity had never seen before. With the unprecedented amount of time indoors I had on my hands, I had time to introspect.</p>
          <p>What do I want to do with my life?</p>
          <p>Is university the right thing for me?</p>
          <p>What will make me happy?</p>
          <p>In a time of instability what I needed most was unwavering confidence that I could leave my mark on the world. I spent hours, days, weeks – months – thinking about passions and talents I had. What did I see myself doing?</p>
          <p>Baking. I was always good at it. My understanding of chemistry helped me develop and change recipes. It made sense.</p>
          <p>In 2021, I chose to open my business (initially named Cakes by Olayide) instead of going to university. I worked full time jobs to fund it at the same time. My skills improved quickly and I wanted to open a brick-and-mortar store one day.</p>
          <p>But now I found myself wanting to go to university. So I did.</p>
          <p>I closed down my business and focused on my studies, knowing that I wasn't equipped to do both at the same time. Now that I'm at the end of my education journey, I decided to reopen and rebrand.</p>
          <p>My journey has been nowhere near linear, but I'm grateful for it. Running a business has helped me grow and understand the world around me. I love meeting people and getting to know them. To make cakes and bakes for them. To make their day special, or even just a little sweeter. I hope to continue on this path and scale up to having a storefront one day.<br/>Thanks for joining me on this journey,<br/>Olayide</p>
        </section>
        <aside className="aboutus-side">
          <div className="aboutus-image-wrapper">
            <img src="/images/about-portrait.png" alt="Olayide portrait" className="aboutus-image" />
          </div>
          <div className="aboutus-contact">
            <h2>Contact us</h2>
            <form className="aboutus-contact-form">
              <div className="aboutus-form-row">
                <input type="text" placeholder="First name" name="firstName" />
                <input type="text" placeholder="Last name" name="lastName" />
              </div>
              <input type="email" placeholder="Email address" name="email" />
              <textarea placeholder="Your message" name="message" rows="4"></textarea>
              <button type="submit">Submit</button>
            </form>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUsPage;
