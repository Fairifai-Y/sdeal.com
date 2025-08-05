import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './FAQ.css';

const FAQ = () => {
  const { currentLanguage } = useLanguage();
  const [openItems, setOpenItems] = useState({});

  const getLanguageName = (lang) => {
    const names = {
      en: 'English',
      nl: 'Nederlands',
      de: 'Deutsch',
      fr: 'Français'
    };
    return names[lang] || 'English';
  };

  const faqData = [
    {
      id: 1,
      category: {
        en: 'Finance & Order',
        nl: 'Financiën & Bestelling',
        de: 'Finanzen & Bestellung',
        fr: 'Finance & Commande'
      },
      question: {
        en: 'Where can I find my invoice?',
        nl: 'Waar kan ik mijn factuur vinden?',
        de: 'Wo kann ich meine Rechnung finden?',
        fr: 'Où puis-je trouver ma facture?'
      },
      answer: {
        en: 'In your dashboard you can find all your invoices under the "invoice" button',
        nl: 'In uw dashboard kunt u al uw facturen vinden onder de "factuur" knop',
        de: 'In Ihrem Dashboard finden Sie alle Ihre Rechnungen unter der "Rechnung" Schaltfläche',
        fr: 'Dans votre tableau de bord, vous pouvez trouver toutes vos factures sous le bouton "facture"'
      }
    },
    {
      id: 2,
      category: {
        en: 'Onboarding',
        nl: 'Onboarding',
        de: 'Onboarding',
        fr: 'Intégration'
      },
      question: {
        en: 'How can I calculate my commission?',
        nl: 'Hoe kan ik mijn commissie berekenen?',
        de: 'Wie kann ich meine Provision berechnen?',
        fr: 'Comment puis-je calculer ma commission?'
      },
      answer: {
        en: `<b>All sellers</b><br> (Your % commission x total order amount) = commission EX VAT<p><br> <h3>What is my payout?</h3> <p> <b>When you are a seller from the Netherlands:</b><br> We also calculate the VAT and add this to the commission<br> (Your % commission x total order amount) = commission EX VAT * 21% = commission INCL VAT <p> <b>When you are a seller from inside the EU (not Netherlands):</b><br> (Your % commission x total order amount) = commission EX VAT <p> <b>When you are a seller from outside the EU:</b><br> We also calculate the VAT of the total order amount and add this to the commission amount for IOSS regulations<br> (Your % commission x total order amount) = commission EX VAT + VAT of total order <p> Example: <ul> <li>Order amount customer <b>80 Euro</b>, including shipping</li> <li>Commission <b>15%</b></li> <li>Commission Dutch seller: (80 Euro * 15%) = 12 Euro + 21% VAT (12 * 21%) = <b>14,52 Euro INCL VAT</b></li> <li>Payout Dutch seller: (80 - 14,52) = <b>65,48 Euro</b></li> <li>Commission EU seller: (80 Euro * 15%) = <b>12 Euro EXCL VAT</b></li> <li>Payout EU seller: (80 - 12) = <b>68 Euro</b></li> <li>Commission NON EU seller: (80 Euro * 15%) = 12 Euro + VAT of order (80 * order country VAT (ex. NL 21%)) = <b>25,88 Including order VAT</b></li> <li>Payout NON EU seller: (80 - 25,88) = <b>54,12 Euro</b></li> </ul>`,
        nl: `<b>Alle verkopers</b><br> (Uw % commissie x totale orderbedrag) = commissie EXCL BTW <p><br> <h3>Wat is mijn uitbetaling?</h3> <p> <b>Wanneer u een verkoper bent uit Nederland:</b><br> We berekenen ook de BTW en voegen deze toe aan de commissie<br> (Uw % commissie x totale orderbedrag) = commissie EXCL BTW * 21% = commissie INCL BTW <p> <b>Wanneer u een verkoper bent uit de EU (niet Nederland):</b><br> (Uw % commissie x totale orderbedrag) = commissie EXCL BTW <p> <b>Wanneer u een verkoper bent van buiten de EU:</b><br> We berekenen ook de BTW van het totale orderbedrag en voegen dit toe aan het commissieberekeningsbedrag voor IOSS-regelgeving<br> (Uw % commissie x totale orderbedrag) = commissie EXCL BTW + BTW over totale order <p> Voorbeeld: <ul> <li>Orderbedrag klant <b>80 Euro</b>, inclusief verzending</li> <li>Commissie <b>15%</b></li> <li>Commissie Nederlandse verkoper: (80 Euro * 15%) = 12 Euro + 21% BTW (12 * 21%) = <b>14,52 Euro INCL BTW</b></li> <li>Uitbetaling Nederlandse verkoper: (80 - 14,52) = <b>65,48 Euro</b></li> <li>Commissie EU-verkoper: (80 Euro * 15%) = <b>12 Euro EXCL BTW</b></li> <li>Uitbetaling EU-verkoper: (80 - 12) = <b>68 Euro</b></li> <li>Commissie verkoper buiten de EU: (80 Euro * 15%) = 12 Euro + BTW over order (80 * BTW-tarief van orderland (bijv. NL 21%)) = <b>25,88 Euro inclusief order-BTW</b></li> <li>Uitbetaling verkoper buiten de EU: (80 - 25,88) = <b>54,12 Euro</b></li> </ul>`,
        de: `<b>Alle Verkäufer</b><br> (Ihr % Provision x Gesamtbestellbetrag) = Provision OHNE MwSt <p><br> <h3>Was ist meine Auszahlung?</h3> <p> <b>Wenn Sie ein Verkäufer aus den Niederlanden sind:</b><br> Wir berechnen auch die MwSt und fügen diese zur Provision hinzu<br> (Ihr % Provision x Gesamtbestellbetrag) = Provision OHNE MwSt * 21% = Provision INKL MwSt <p> <b>Wenn Sie ein Verkäufer aus der EU sind (nicht Niederlande):</b><br> (Ihr % Provision x Gesamtbestellbetrag) = Provision OHNE MwSt <p> <b>Wenn Sie ein Verkäufer von außerhalb der EU sind:</b><br> Wir berechnen auch die MwSt des Gesamtbestellbetrags und fügen diese zum Provisionsbetrag für IOSS-Vorschriften hinzu<br> (Ihr % Provision x Gesamtbestellbetrag) = Provision OHNE MwSt + MwSt des Gesamtbestellbetrags <p> Beispiel: <ul> <li>Bestellbetrag Kunde <b>80 Euro</b>, inklusive Versand</li> <li>Provision <b>15%</b></li> <li>Provision niederländischer Verkäufer: (80 Euro * 15%) = 12 Euro + 21% MwSt (12 * 21%) = <b>14,52 Euro INKL MwSt</b></li> <li>Auszahlung niederländischer Verkäufer: (80 - 14,52) = <b>65,48 Euro</b></li> <li>Provision EU-Verkäufer: (80 Euro * 15%) = <b>12 Euro OHNE MwSt</b></li> <li>Auszahlung EU-Verkäufer: (80 - 12) = <b>68 Euro</b></li> <li>Provision Nicht-EU-Verkäufer: (80 Euro * 15%) = 12 Euro + MwSt der Bestellung (80 * MwSt-Satz des Bestelllandes (z.B. NL 21%)) = <b>25,88 inklusive Bestell-MwSt</b></li> <li>Auszahlung Nicht-EU-Verkäufer: (80 - 25,88) = <b>54,12 Euro</b></li> </ul>`,
        fr: `<b>Tous les vendeurs</b><br> (Votre % commission x montant total de la commande) = commission HT <p><br> <h3>Quel est mon paiement?</h3> <p> <b>Lorsque vous êtes un vendeur des Pays-Bas:</b><br> Nous calculons également la TVA et l'ajoutons à la commission<br> (Votre % commission x montant total de la commande) = commission HT * 21% = commission TTC <p> <b>Lorsque vous êtes un vendeur de l'UE (pas des Pays-Bas):</b><br> (Votre % commission x montant total de la commande) = commission HT <p> <b>Lorsque vous êtes un vendeur de l'extérieur de l'UE:</b><br> Nous calculons également la TVA du montant total de la commande et l'ajoutons au montant de la commission pour les réglementations IOSS<br> (Votre % commission x montant total de la commande) = commission HT + TVA du montant total de la commande <p> Exemple: <ul> <li>Montant de la commande client <b>80 Euro</b>, frais de port inclus</li> <li>Commission <b>15%</b></li> <li>Commission vendeur néerlandais: (80 Euro * 15%) = 12 Euro + 21% TVA (12 * 21%) = <b>14,52 Euro TTC</b></li> <li>Paiement vendeur néerlandais: (80 - 14,52) = <b>65,48 Euro</b></li> <li>Commission vendeur UE: (80 Euro * 15%) = <b>12 Euro HT</b></li> <li>Paiement vendeur UE: (80 - 12) = <b>68 Euro</b></li> <li>Commission vendeur hors UE: (80 Euro * 15%) = 12 Euro + TVA de la commande (80 * taux de TVA du pays de commande (ex. NL 21%)) = <b>25,88 incluant la TVA de la commande</b></li> <li>Paiement vendeur hors UE: (80 - 25,88) = <b>54,12 Euro</b></li> </ul>`
      }
    },
    {
      id: 3,
      category: {
        en: 'Contract',
        nl: 'Contract',
        de: 'Vertrag',
        fr: 'Contrat'
      },
      question: {
        en: 'What should I do to terminate my contract?',
        nl: 'Wat moet ik doen om mijn contract te beëindigen?',
        de: 'Was muss ich tun, um meinen Vertrag zu kündigen?',
        fr: 'Que dois-je faire pour résilier mon contrat?'
      },
      answer: {
        en: 'Just empty your feed and send us an email within 24 to 48 hours your products will be removed from our platform.',
        nl: 'Leeg gewoon uw feed en stuur ons een e-mail binnen 24 tot 48 uur worden uw producten van ons platform verwijderd.',
        de: 'Leeren Sie einfach Ihren Feed und senden Sie uns eine E-Mail. Innerhalb von 24 bis 48 Stunden werden Ihre Produkte von unserer Plattform entfernt.',
        fr: 'Videz simplement votre flux et envoyez-nous un e-mail. Dans les 24 à 48 heures, vos produits seront supprimés de notre plateforme.'
      }
    },
    {
      id: 4,
      category: {
        en: 'Finance & Order',
        nl: 'Financiën & Bestelling',
        de: 'Finanzen & Bestellung',
        fr: 'Finance & Commande'
      },
      question: {
        en: 'Why do I see a debit from my account at the beginning of the month?',
        nl: 'Waarom zie ik een debet van mijn rekening aan het begin van de maand?',
        de: 'Warum sehe ich eine Belastung von meinem Konto zu Beginn des Monats?',
        fr: 'Pourquoi vois-je un débit de mon compte au début du mois?'
      },
      answer: {
        en: 'When you are selling on SDeal, you pay a minimum fee as specified in your contract. If your commission does not exceed this amount, we will collect the difference between your commission for that month and the fee agreed upon in the contract',
        nl: 'Wanneer u verkoopt op SDeal, betaalt u een minimumvergoeding zoals gespecificeerd in uw contract. Als uw commissie dit bedrag niet overschrijdt, zullen we het verschil tussen uw commissie voor die maand en de in het contract overeengekomen vergoeding innen',
        de: 'Wenn Sie auf SDeal verkaufen, zahlen Sie eine Mindestgebühr, wie in Ihrem Vertrag festgelegt. Wenn Ihre Provision diesen Betrag nicht übersteigt, werden wir die Differenz zwischen Ihrer Provision für diesen Monat und der im Vertrag vereinbarten Gebühr einziehen',
        fr: 'Lorsque vous vendez sur SDeal, vous payez des frais minimums comme spécifié dans votre contrat. Si votre commission ne dépasse pas ce montant, nous percevrons la différence entre votre commission pour ce mois et les frais convenus dans le contrat'
      }
    },
    {
      id: 5,
      category: {
        en: 'Finance & Order',
        nl: 'Financiën & Bestelling',
        de: 'Finanzen & Bestellung',
        fr: 'Finance & Commande'
      },
      question: {
        en: 'Why do I see a negative amount in my Payout overview?',
        nl: 'Waarom zie ik een negatief bedrag in mijn Uitbetaling overzicht?',
        de: 'Warum sehe ich einen negativen Betrag in meiner Auszahlungsübersicht?',
        fr: 'Pourquoi vois-je un montant négatif dans mon aperçu des paiements?'
      },
      answer: {
        en: 'When you issue a refund for a new order or one we have already paid, your balance could be negative for the weekly payout. If you have accepted automatic payments, we will collect the amount in the same week. If you have not accepted automatic payments, we will deduct it from the next payment.',
        nl: 'Wanneer u een terugbetaling uitreikt voor een nieuwe bestelling of een bestelling die we al hebben betaald, kan uw saldo negatief zijn voor de wekelijkse uitbetaling. Als u automatische betalingen heeft geaccepteerd, zullen we het bedrag in dezelfde week innen. Als u geen automatische betalingen heeft geaccepteerd, zullen we het aftrekken van de volgende betaling.',
        de: 'Wenn Sie eine Rückerstattung für eine neue Bestellung oder eine bereits bezahlte Bestellung ausstellen, könnte Ihr Guthaben für die wöchentliche Auszahlung negativ sein. Wenn Sie automatische Zahlungen akzeptiert haben, werden wir den Betrag in derselben Woche einziehen. Wenn Sie keine automatischen Zahlungen akzeptiert haben, werden wir ihn von der nächsten Zahlung abziehen.',
        fr: 'Lorsque vous émettez un remboursement pour une nouvelle commande ou une commande que nous avons déjà payée, votre solde pourrait être négatif pour le paiement hebdomadaire. Si vous avez accepté les paiements automatiques, nous percevrons le montant la même semaine. Si vous n\'avez pas accepté les paiements automatiques, nous le déduirons du prochain paiement.'
      }
    },
    {
      id: 6,
      category: {
        en: 'Onboarding',
        nl: 'Onboarding',
        de: 'Onboarding',
        fr: 'Intégration'
      },
      question: {
        en: 'How can I update my data?',
        nl: 'Hoe kan ik mijn gegevens bijwerken?',
        de: 'Wie kann ich meine Daten aktualisieren?',
        fr: 'Comment puis-je mettre à jour mes données?'
      },
      answer: {
        en: 'Stock and prices are updated every 15 minutes. New products are added every night. Updates to images, names, and descriptions are not processed automatically. To update these, you can submit a request in our dashboard under FEEDS or send an email to kirsten@sdeal.com.',
        nl: 'Voorraad en prijzen worden elke 15 minuten bijgewerkt. Nieuwe producten worden elke nacht toegevoegd. Updates van afbeeldingen, namen en beschrijvingen worden niet automatisch verwerkt. Om deze bij te werken, kunt u een verzoek indienen in ons dashboard onder FEEDS of een e-mail sturen naar kirsten@sdeal.com.',
        de: 'Lagerbestand und Preise werden alle 15 Minuten aktualisiert. Neue Produkte werden jede Nacht hinzugefügt. Updates von Bildern, Namen und Beschreibungen werden nicht automatisch verarbeitet. Um diese zu aktualisieren, können Sie eine Anfrage in unserem Dashboard unter FEEDS einreichen oder eine E-Mail an kirsten@sdeal.com senden.',
        fr: 'Les stocks et les prix sont mis à jour toutes les 15 minutes. De nouveaux produits sont ajoutés chaque nuit. Les mises à jour des images, noms et descriptions ne sont pas traitées automatiquement. Pour les mettre à jour, vous pouvez soumettre une demande dans notre tableau de bord sous FEEDS ou envoyer un e-mail à kirsten@sdeal.com.'
      }
    }
  ];

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = [...new Set(faqData.map(item => item.category[currentLanguage] || item.category.en))];

  return (
    <div className="faq-container">
      <div className="w3-content w3-padding-64">
        <div className="faq-header">
          <h1 className="w3-center">
            {getTranslation(currentLanguage, 'faq')}
          </h1>
          <div className="language-indicator">
            <svg className="globe-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="language-name">{getLanguageName(currentLanguage)}</span>
          </div>
        </div>
        
        <div className="faq-content">
          {categories.map(category => (
            <div key={category} className="faq-category">
              <h2 className="category-title">{category}</h2>
              <div className="faq-items">
                {faqData
                  .filter(item => (item.category[currentLanguage] || item.category.en) === category)
                  .map(item => (
                    <div key={item.id} className="faq-item">
                      <button 
                        className={`faq-question ${openItems[item.id] ? 'active' : ''}`}
                        onClick={() => toggleItem(item.id)}
                      >
                        <span>{item.question[currentLanguage] || item.question.en}</span>
                        <span className="faq-icon">
                          {openItems[item.id] ? '−' : '+'}
                        </span>
                      </button>
                      {openItems[item.id] && (
                        <div className="faq-answer">
                          <div 
                            dangerouslySetInnerHTML={{ __html: item.answer[currentLanguage] || item.answer.en }}
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