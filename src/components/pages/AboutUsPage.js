import React from 'react';
import '../styles/AboutUsPage.css';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';

const AboutUsPage = () => {
  return (
    <div className="aboutus-page-container">
      <PageTitle title="About Us" />
      <Header />
      <main className="aboutus-main">
        <section className="aboutus-content">
          <h1>Our Story</h1>
          <p>From a young age, I was good at baking. My mum taught me and my siblings how to do it from a young age with a stained recipe book covered in little orange and blue fingerprints. My family has always been competitive, so we’d run competitions around who could make the best cupcakes (although I’m sure it was an excuse to eat cupcakes more than anything).</p>
          <p>We’d all have our own colour we’d decorate our cakes with. Mine was yellow. The icing often ended up orange because I’d add too much. My siblings were just as heavy handed and we ended up with cakes that turned blue as a result of too much colouring in the icing. I don’t think anyone ate those ones.</p>
          <p>Baking became something I did for fun, for my family and eventually my friends. It’s something I’ve always loved doing and I believe I have a talent for.</p>
          <p>And then Covid hit. The world changed unrecognisably. It threw a spanner into all the plans I had for myself. With the unprecedented amount of time indoors I had on my hands, I had time to introspect (and bake).</p>
          <p>I found myself questioning if I really wanted to follow the path I’d laid out for myself, or if I should pursue something else. So, I ended up choosing to open a business in 2021. I sold cakes and brownies to many people and enjoyed watching my progress over time. There aren’t many cakes (or pictures) from then that I’d show off, but I look back on then fondly.</p>
          <p>In 2023 I decided to go to university. I closed down my business and began pursuing a degree in Screenwriting. I’ve met a lot of great people since then, and many encouraged me to start baking again.</p>
          <p>So here we are. I’ve returned to bake again, this time more confident and experienced than ever. I’m here to make your day a little brighter with something sweet.</p>
          <p>Hopefully one day you’ll be able to walk into a brick-and-mortar bakery of mine, after having seen something I’ve written. Who knows?</p>
          <p>Whatever the future holds, I’ll be baking and writing like I always have.</p>
          <p>I hope you’ll join me on my journey,<br/>Olayide</p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUsPage;
