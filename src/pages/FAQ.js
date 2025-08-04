import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './FAQ.css';

const FAQ = () => {
  const { currentLanguage } = useLanguage();
  const [openItems, setOpenItems] = useState({});

  const faqData = [
    {
      id: 1,
      category: 'Finance & Order',
      question: 'Where can i find my invoice?',
      answer: 'In your dashboard you can find al your invoices under the "invoice" button'
    },
    {
      id: 2,
      category: 'Onboarding',
      question: 'How can i calculate my commission?',
      answer: `<b>Alle verkopers</b><br> (Uw % commissie x totale orderbedrag) = commissie EXCL BTW <p><br> <h3>Wat is mijn uitbetaling?</h3> <p> <b>Wanneer u een verkoper bent uit Nederland:</b><br> We berekenen ook de BTW en voegen deze toe aan de commissie<br> (Uw % commissie x totale orderbedrag) = commissie EXCL BTW * 21% = commissie INCL BTW <p> <b>Wanneer u een verkoper bent uit de EU (niet Nederland):</b><br> (Uw % commissie x totale orderbedrag) = commissie EXCL BTW <p> <b>Wanneer u een verkoper bent van buiten de EU:</b><br> We berekenen ook de BTW van het totale orderbedrag en voegen dit toe aan het commissieberekeningsbedrag voor IOSS-regelgeving<br> (Uw % commissie x totale orderbedrag) = commissie EXCL BTW + BTW over totale order <p> Voorbeeld: <ul> <li>Orderbedrag klant <b>80 Euro</b>, inclusief verzending</li> <li>Commissie <b>15%</b></li> <li>Commissie Nederlandse verkoper: (80 Euro * 15%) = 12 Euro + 21% BTW (12 * 21%) = <b>14,52 Euro INCL BTW</b></li> <li>Uitbetaling Nederlandse verkoper: (80 - 14,52) = <b>65,48 Euro</b></li> <li>Commissie EU-verkoper: (80 Euro * 15%) = <b>12 Euro EXCL BTW</b></li> <li>Uitbetaling EU-verkoper: (80 - 12) = <b>68 Euro</b></li> <li>Commissie verkoper buiten de EU: (80 Euro * 15%) = 12 Euro + BTW over order (80 * BTW-tarief van orderland (bijv. NL 21%)) = <b>25,88 Euro inclusief order-BTW</b></li> <li>Uitbetaling verkoper buiten de EU: (80 - 25,88) = <b>54,12 Euro</b></li> </ul> <br> <h3>**ENGLISH **</h3> <br> <b>All sellers</b> (Your % commission x total order amount) = commission EX VAT<p><br> <h3>What is my payout?</h3> <p> <b>When you are a seller from the Netherlands:</b> We also calculate the VAT and ad this to the commission <br>(Your % commission x total order amount) = commission EX VAT * 21% = commission INCL VAT <p> <b>When you are a seller from inside the EU (not netherlands)</b> <br>(Your % commission x total order amount) = commission EX VAT <p> <b>When you are a seller from outside the EU:</b> We also calculate the VAT of the total order amount and add this to the commission amount for IOSS regulations <br>(Your % commission x total order amount) = commission EX VAT + VAT of total order <p> Example: <ul> <li>Order amount customer <b>80 Euro</b> including shipping <li>Commission <b>15%</b> <li>Commission Dutch seller (80 Euro * 15%) = 12 Euro + 21% VAT (12 * 21%) = <b>14,52 Euro INCL VAT</b> <li>Payout Dutch seller (80 - 14,52 = <b>65,48 Euro </b>) <li>Commission EU seller (80 Euro * 15%) = <b>12 Euro EXCL VAT</b> <li>Payout EU seller (80 - 12 = <b>68 Euro</b>) <li>Commission NON EU seller (80 Euro * 15%) = 12 Euro + VAT of order (80 * order country VAT (ex. NL 21%)) = <b>25,88 Including order VAT</b> <li>Payout NON EU seller(80 - 25,88 = <b>54,12 Euro </b>) </ul>`
    },
    {
      id: 3,
      category: 'Contract',
      question: 'What should i do to terminate my contract?',
      answer: 'Just empty your feed and send us an email within 24 to 48 hours your products will be removed from our platform.'
    },
    {
      id: 4,
      category: 'Finance & Order',
      question: 'Why do i see a debit from my account in the beginnin of the month?',
      answer: 'When you are selling on SDeal or Sportdeal, you pay a minimum fee as specified in your contract. If your commission does not exceed this amount, we will collect the difference between your commission for that month and the fee agreed upon in the contract'
    },
    {
      id: 5,
      category: 'Finance & Order',
      question: 'Why do i see a negative amount in my Payout overview?',
      answer: 'When you issue a refund for a new order or one we have already paid, your balance could be negative for the weekly payout. If you have accepted automatic payments, we will collect the amount in the same week. If you have not accepted automatic payments, we will deduct it from the next payment.'
    },
    {
      id: 6,
      category: 'Onboarding',
      question: 'How can i update my data?',
      answer: 'Stock and prices are updated every 15 minutes. New products are added every night. Updates to images, names, and descriptions are not processed automatically. To update these, you can submit a request in our dashboard under FEEDS or send an email to kirsten@sdeal.com.'
    }
  ];

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = [...new Set(faqData.map(item => item.category))];

  return (
    <div className="faq-container">
      <div className="w3-content w3-padding-64">
        <h1 className="w3-center">
          {getTranslation('faq', currentLanguage)}
        </h1>
        
        <div className="faq-content">
          {categories.map(category => (
            <div key={category} className="faq-category">
              <h2 className="category-title">{category}</h2>
              <div className="faq-items">
                {faqData
                  .filter(item => item.category === category)
                  .map(item => (
                    <div key={item.id} className="faq-item">
                      <button 
                        className={`faq-question ${openItems[item.id] ? 'active' : ''}`}
                        onClick={() => toggleItem(item.id)}
                      >
                        <span>{item.question}</span>
                        <span className="faq-icon">
                          {openItems[item.id] ? '−' : '+'}
                        </span>
                      </button>
                      {openItems[item.id] && (
                        <div className="faq-answer">
                          <div 
                            dangerouslySetInnerHTML={{ __html: item.answer }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ; 