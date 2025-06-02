import React from 'react';
import { FaTimes } from 'react-icons/fa';
import '../styles/HolidayModal.css';

const HolidayModal = ({ isOpen, onClose, holiday }) => {
  if (!isOpen) return null;

  const holidayData = {
    'Birthdays': {
      description: 'A Birthday Bento Cake and 5 or 8 Cupcakes of the same flavour. Customise your cakes with a flavour, colour scheme and extras.',
      flavours: [
        'Vanilla',
        'Chocolate',
        'Cookies and Cream (with Oreos)',
        'Salted Caramel (with Biscoff biscuits)',
        'Red Velvet',
        'Carrot Cake',
        'Tiramisu'
      ],
      decoration: 'Bento cakes are decorated with piping in a similar vein to your cupcakes. You can have a message piped on (no longer than 5 words), for no additional fee.',
      pricing: [
        'Bento cake + 5 cupcakes is £40.',
        'Bento cake + 8 cupcakes is £45.'
      ],
      extras: [
        { name: 'Fresh Fruit', price: '£5' },
        { name: 'Mini chocolate bars', price: '£3' },
        { name: 'Macarons', price: '£7' },
        { name: 'Happy Birthday Cake topper (choose colour)', price: 'None' },
        { name: 'Custom Acrylic cake topper (type exact text)', price: '£7' }
      ]
    },
    'Valentine\'s Day': {
      description: 'Celebrate love with our romantic Valentine\'s Day Bento Cake and Cupcake set. Perfect for couples or sharing with loved ones.',
      flavours: [
        'Red Velvet',
        'Chocolate',
        'Strawberry',
        'Vanilla with Raspberry',
        'White Chocolate'
      ],
      decoration: 'Our Valentine\'s cakes feature romantic designs with hearts, roses, and love-themed decorations. Custom messages available.',
      pricing: [
        'Bento cake + 5 cupcakes is £45.',
        'Bento cake + 8 cupcakes is £50.'
      ],
      extras: [
        { name: 'Chocolate Hearts', price: '£4' },
        { name: 'Edible Gold Hearts', price: '£6' },
        { name: 'Fresh Roses', price: '£8' },
        { name: 'Love Message Piping', price: 'None' }
      ]
    },
    'Mother\'s Day': {
      description: 'A Red, pink and white Mothers\' Day bento cake and 5 or 8 Cupcakes of the same flavour and colour scheme. Customise your cakes by choosing a flavour and extras.',
      flavours: [
        'Vanilla',
        'Chocolate',
        'Berry'
      ],
      decoration: 'The Mothers\' Day bento cakes are decorated with piping in a similar vein to your cupcakes. You can have a message piped on (no longer than 5 words), for no additional fee.',
      pricing: [
        'Bento cake + 5 cupcakes is £40.',
        'Bento cake + 8 cupcakes is £45.'
      ],
      extras: [
        { name: 'Fresh Fruit', price: '£5' },
        { name: 'Mini chocolate bars', price: '£3' },
        { name: 'Macarons', price: '£7' },
        { name: 'Happy Mothers\' Day Cake topper (choose colour)', price: 'None' },
        { name: 'Mum Acrylic cake topper (type exact text)', price: 'None' }
      ]
    },
    'Easter': {
      description: 'Celebrate Easter with our spring-themed Bento Cake and Cupcake set. Pastel colors and Easter-themed decorations.',
      flavours: [
        'Carrot Cake',
        'Vanilla',
        'Chocolate',
        'Lemon',
        'Coconut'
      ],
      decoration: 'Our Easter cakes feature pastel colors, spring flowers, and Easter-themed decorations like bunnies and eggs.',
      pricing: [
        'Bento cake + 5 cupcakes is £42.',
        'Bento cake + 8 cupcakes is £47.'
      ],
      extras: [
        { name: 'Chocolate Eggs', price: '£4' },
        { name: 'Sugar Bunnies', price: '£5' },
        { name: 'Pastel Sprinkles', price: '£3' },
        { name: 'Easter Message', price: 'None' }
      ]
    },
    'Christmas': {
      description: 'Make your holiday season special with our festive Christmas Bento Cake and Cupcake set. Perfect for family gatherings.',
      flavours: [
        'Christmas Pudding',
        'Gingerbread',
        'Chocolate',
        'Vanilla',
        'Fruit Cake'
      ],
      decoration: 'Our Christmas cakes feature festive designs with snowflakes, holly, and Christmas-themed decorations.',
      pricing: [
        'Bento cake + 5 cupcakes is £48.',
        'Bento cake + 8 cupcakes is £53.'
      ],
      extras: [
        { name: 'Christmas Tree Topper', price: '£5' },
        { name: 'Edible Snowflakes', price: '£4' },
        { name: 'Festive Sprinkles', price: '£3' },
        { name: 'Christmas Message', price: 'None' }
      ]
    },
    'Graduation': {
      description: 'Celebrate academic achievements with our Graduation Bento Cake and Cupcake set. Perfect for graduation parties.',
      flavours: [
        'Chocolate',
        'Vanilla',
        'Red Velvet',
        'Cookies and Cream',
        'Caramel'
      ],
      decoration: 'Our Graduation cakes feature academic-themed decorations with graduation caps and diplomas.',
      pricing: [
        'Bento cake + 5 cupcakes is £45.',
        'Bento cake + 8 cupcakes is £50.'
      ],
      extras: [
        { name: 'Graduation Cap Topper', price: '£6' },
        { name: 'Edible Diploma', price: '£5' },
        { name: 'School Colors', price: 'None' },
        { name: 'Custom Message', price: 'None' }
      ]
    },
    'Eid': {
      description: 'Greens and Neutrals Eid bento cake and 5 or 8 Cupcakes of the same flavour and colour scheme. Customise your cakes by choosing a flavour and extras.',
      flavours: [
        'Vanilla',
        'Chocolate',
        'Red Velvet'
      ],
      decoration: 'Eid bento cakes are decorated with piping in a similar vein to your cupcakes. You can opt to have Eid Murbarak written in buttercream or a cake topper.',
      pricing: [
        'Bento cake + 5 cupcakes is £40.',
        'Bento cake + 8 cupcakes is £45.'
      ],
      extras: [
        { name: 'Fresh Fruit', price: '£5' },
        { name: 'Mini chocolate bars', price: '£3' },
        { name: 'Macarons', price: '£7' },
        { name: 'Eid Murbarak Cake topper (choose colour)', price: 'None' }
      ]
    },
    'Father\'s Day': {
      description: 'Blues and whites are the colours of 2025\'s Fathers\' Day Bento Cake and Cupcake set. Buy your loved one something special and customise your order by choosing a flavour and extras. Orders will be released from 9am to 7pm on June 14th.',
      flavours: [
        'Vanilla',
        'Chocolate',
        'Salted Caramel'
      ],
      decoration: 'The Fathers\' Day bento cakes are decorated with piping in a similar vein to your cupcakes. You can have a message piped on (no longer than 5 words), for no additional fee.',
      pricing: [
        'Bento cake + 5 cupcakes is £40.',
        'Bento cake + 8 cupcakes is £45.'
      ],
      extras: [
        { name: 'Sprinkles', price: 'None' },
        { name: 'Fresh Fruit', price: '£5' },
        { name: 'Mini chocolate bars', price: '£3' },
        { name: 'Meringues', price: '£7' },
        { name: 'Happy Fathers\' Day Cake topper (choose colour)', price: 'None' },
        { name: 'Dad Acrylic cake topper (type exact text)', price: 'None' }
      ]
    }
  };

  const data = holidayData[holiday] || {};

  return (
    <div className="holiday-modal-overlay" onClick={onClose}>
      <div className="holiday-modal" onClick={e => e.stopPropagation()}>
        <button className="holiday-modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>{holiday}</h2>
        <div className="holiday-modal-content">
          <p className="holiday-description">{data.description}</p>
          
          <div className="holiday-section">
            <h3>All Year Flavours</h3>
            <ul>
              {data.flavours?.map((flavour, index) => (
                <li key={index}>{flavour}</li>
              ))}
            </ul>
          </div>

          <div className="holiday-section">
            <h3>Decoration</h3>
            <p>{data.decoration}</p>
          </div>

          <div className="holiday-section">
            <h3>Pricing</h3>
            <ul>
              {data.pricing?.map((price, index) => (
                <li key={index}>{price}</li>
              ))}
            </ul>
          </div>

          <div className="holiday-section">
            <h3>Extras</h3>
            <table className="extras-table">
              <thead>
                <tr>
                  <th>Toppings</th>
                  <th>Additional Price</th>
                </tr>
              </thead>
              <tbody>
                {data.extras?.map((extra, index) => (
                  <tr key={index}>
                    <td>{extra.name}</td>
                    <td>{extra.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayModal; 