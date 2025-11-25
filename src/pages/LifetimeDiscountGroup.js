import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import './LifetimeDiscountGroup.css';

const LifetimeDiscountGroup = () => {
  const { currentLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openFAQ, setOpenFAQ] = useState({});
  const paymentStatus = searchParams.get('payment');

  const translations = {
    en: {
      title: 'Lifetime Discount Group',
      subtitle: 'Enter your email address to secure lifetime discounts on SDeal',
      emailPlaceholder: 'Your email address',
      emailLabel: 'Email Address',
      payButton: 'Pay €14.95',
      processing: 'Processing...',
      successTitle: 'Thank you for joining the Lifetime Discount Group',
      successMessage: 'Your account will be available for lifetime discounts within 24 hours.',
      errorMessage: 'An error occurred. Please try again.',
      emailRequired: 'Please enter your email address',
      emailInvalid: 'Please enter a valid email address',
      faqTitle: 'FAQ – Lifetime Discount (€14.95)',
      faqSubtitle: 'Lifetime 7.5% discount on all your SDeal orders',
      faq: [
        {
          q: 'What does "lifetime discount" mean?',
          a: 'Lifetime discount means you get 7.5% off on all your orders forever, as long as SDeal is active as a platform and you have an active customer account. There are no recurring costs or hidden conditions.'
        },
        {
          q: 'How does it work exactly?',
          a: 'After your one-time payment of €14.95, the 7.5% discount is automatically applied to every order you make on SDeal. You will see the discount in your shopping cart and during checkout.'
        },
        {
          q: 'Does the discount apply to all products?',
          a: 'Yes, the discount applies to all products on SDeal, unless the product page explicitly states that an item is excluded (e.g., by a seller action).'
        },
        {
          q: 'Who provides this discount: SDeal or the seller?',
          a: 'The discount is provided by SDeal as a platform, not by individual sellers. That\'s why the discount works with all our 300+ connected sellers and on more than 1.5 million products.'
        },
        {
          q: 'Are there any fine print?',
          a: 'No. One-time payment of €14.95. No subscription. No extra costs. Discount remains valid as long as your account stays active and SDeal exists.'
        },
        {
          q: 'What happens if SDeal changes or gets a new version?',
          a: 'If the structure of the platform changes, the value of your Lifetime Discount remains intact. We will never terminate your discount without good reason and we comply with applicable consumer law. If something changes, we will inform you in time.'
        },
        {
          q: 'What if I delete my account?',
          a: 'If you delete your account yourself, your Lifetime Discount will also expire. If you create a new account, the discount will not automatically be on it.'
        },
        {
          q: 'Can I share the discount with others?',
          a: 'No, the discount is personal and linked to your SDeal account. Sharing or reselling Lifetime Discount is not allowed.'
        },
        {
          q: 'Is my payment really one-time?',
          a: 'Yes. You pay once €14.95 and then never again. You do not have to pay annually or monthly.'
        },
        {
          q: 'Can I get my money back?',
          a: 'If you have a technical problem that prevents the discount from working, we will fix it or offer an appropriate solution. In that case, please contact our customer service.'
        },
        {
          q: 'How do I know the discount is active?',
          a: 'Within 24 hours after payment, your account is active. When you then go shopping on one of the SDeal domain names, the 7.5% discount will automatically appear in your shopping cart.'
        },
        {
          q: 'Is this offer temporary?',
          a: 'SDeal may change or discontinue this upgrade in the future, but if you have already activated it, your Lifetime Discount will remain valid.'
        },
        {
          q: 'What are the legal terms?',
          a: 'The Lifetime Discount falls under Dutch consumer law and ACM guidelines for clear price communication. By activating the upgrade, you agree to the terms as explained above. We always communicate transparently, without hidden costs or fine print.'
        },
        {
          q: 'Where can I go with questions?',
          a: 'Contact us at info@sdeal.com - we are happy to help you.'
        }
      ]
    },
    nl: {
      title: 'Lifetime Discount Group',
      subtitle: 'Vul je emailadres in waar je levenslange korting op SDeal wil vastleggen',
      emailPlaceholder: 'Je emailadres',
      emailLabel: 'Emailadres',
      payButton: 'Betaal €14,95',
      processing: 'Verwerken...',
      successTitle: 'Bedankt voor het aanmelden voor de Lifetime-Discount Group',
      successMessage: 'Uiterlijk na 24 uur is jouw account beschikbaar voor levenslange korting.',
      errorMessage: 'Er is een fout opgetreden. Probeer het opnieuw.',
      emailRequired: 'Vul je emailadres in',
      emailInvalid: 'Vul een geldig emailadres in',
      faqTitle: 'FAQ – Lifetime Discount (€14,95)',
      faqSubtitle: 'Levenslang 7,5% korting op al je SDeal-bestellingen',
      faq: [
        {
          q: 'Wat betekent "levenslange korting"?',
          a: 'Levenslange korting betekent dat je voor altijd 7,5% korting krijgt op al je bestellingen zolang SDeal als platform actief is en jij een actief klantaccount hebt. Er zijn geen terugkerende kosten of verborgen voorwaarden.'
        },
        {
          q: 'Hoe werkt het precies?',
          a: 'Na je eenmalige betaling van €14,95 wordt de 7,5% korting automatisch toegepast bij elke bestelling die je doet op SDeal. Je ziet de korting in je winkelmandje en tijdens het afrekenen.'
        },
        {
          q: 'Geldt de korting op alle producten?',
          a: 'Ja, de korting geldt op alle producten op SDeal, tenzij op de productpagina expliciet staat vermeld dat een artikel is uitgesloten (bijv. door een seller-actie).'
        },
        {
          q: 'Wie geeft deze korting: SDeal of de seller?',
          a: 'De korting wordt verstrekt door SDeal als platform, niet door individuele sellers. Daarom werkt de korting ook bij al onze 300+ aangesloten sellers en op meer dan 1,5 miljoen producten.'
        },
        {
          q: 'Zijn er kleine lettertjes?',
          a: 'Nee. Eenmalige betaling van €14,95. Geen abonnement. Geen extra kosten. Korting blijft geldig zolang je account actief blijft en SDeal bestaat.'
        },
        {
          q: 'Wat gebeurt er als SDeal verandert of een nieuwe versie krijgt?',
          a: 'Mocht de structuur van het platform veranderen, dan blijft de waarde van je Lifetime Discount intact. We zullen nooit zonder goede reden jouw korting beëindigen en houden ons aan de geldende consumentenwetgeving. Als er iets wijzigt, informeren we je op tijd.'
        },
        {
          q: 'Wat als ik mijn account verwijder?',
          a: 'Als je zelf je account verwijdert, vervalt ook je Lifetime Discount. Maak je een nieuw account aan, dan staat de korting daar niet automatisch op.'
        },
        {
          q: 'Kan ik de korting delen met anderen?',
          a: 'Nee, de korting is persoonlijk en gekoppeld aan jouw SDeal-account. Het delen of doorverkopen van Lifetime Discount is niet toegestaan.'
        },
        {
          q: 'Is mijn betaling echt eenmalig?',
          a: 'Ja. Je betaalt één keer €14,95 en daarna nooit meer iets. Je hoeft dus niet jaarlijks of maandelijks te betalen.'
        },
        {
          q: 'Kan ik mijn geld terugkrijgen?',
          a: 'Als je een technisch probleem hebt waardoor de korting niet werkt, lossen we dit op of bieden we een passende oplossing. Neem in dat geval contact op met onze klantenservice.'
        },
        {
          q: 'Hoe weet ik dat de korting actief is?',
          a: 'Binnen 24 uur na betaling is jouw account actief. Wanneer je dan gaat winkelen op een van de SDeal domeinnamen verschijnt de 7,5% korting automatisch in je winkelmandje.'
        },
        {
          q: 'Is deze aanbieding tijdelijk?',
          a: 'SDeal kan deze upgrade in de toekomst wijzigen of beëindigen, maar als jij hem al hebt geactiveerd, blijft jouw Lifetime Discount gewoon geldig.'
        },
        {
          q: 'Wat zijn de juridische voorwaarden?',
          a: 'De Lifetime Discount valt onder het Nederlands consumentenrecht en de ACM-richtlijnen voor duidelijke prijscommunicatie. Door de upgrade te activeren ga je akkoord met de voorwaarden zoals hierboven uitgelegd. We communiceren altijd transparant, zonder verborgen kosten of kleine lettertjes.'
        },
        {
          q: 'Waar kan ik terecht bij vragen?',
          a: 'Neem contact op via info@sdeal.com - we helpen je graag verder.'
        }
      ]
    },
    de: {
      title: 'Lifetime Discount Group',
      subtitle: 'Geben Sie Ihre E-Mail-Adresse ein, um lebenslange Rabatte auf SDeal zu sichern',
      emailPlaceholder: 'Ihre E-Mail-Adresse',
      emailLabel: 'E-Mail-Adresse',
      payButton: '€14,95 bezahlen',
      processing: 'Wird verarbeitet...',
      successTitle: 'Vielen Dank für den Beitritt zur Lifetime Discount Group',
      successMessage: 'Ihr Konto wird innerhalb von 24 Stunden für lebenslange Rabatte verfügbar sein.',
      errorMessage: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      emailRequired: 'Bitte geben Sie Ihre E-Mail-Adresse ein',
      emailInvalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      faqTitle: 'FAQ – Lifetime Discount (€14,95)',
      faqSubtitle: 'Lebenslang 7,5% Rabatt auf alle Ihre SDeal-Bestellungen',
      faq: [
        {
          q: 'Was bedeutet "Lebenslanger Rabatt"?',
          a: 'Lebenslanger Rabatt bedeutet, dass Sie für immer 7,5% Rabatt auf alle Ihre Bestellungen erhalten, solange SDeal als Plattform aktiv ist und Sie ein aktives Kundenkonto haben. Es gibt keine wiederkehrenden Kosten oder versteckten Bedingungen.'
        },
        {
          q: 'Wie funktioniert es genau?',
          a: 'Nach Ihrer einmaligen Zahlung von €14,95 wird der 7,5% Rabatt automatisch auf jede Bestellung angewendet, die Sie bei SDeal tätigen. Sie sehen den Rabatt in Ihrem Warenkorb und beim Checkout.'
        },
        {
          q: 'Gilt der Rabatt für alle Produkte?',
          a: 'Ja, der Rabatt gilt für alle Produkte auf SDeal, es sei denn, auf der Produktseite wird ausdrücklich angegeben, dass ein Artikel ausgeschlossen ist (z.B. durch eine Verkäuferaktion).'
        },
        {
          q: 'Wer gewährt diesen Rabatt: SDeal oder der Verkäufer?',
          a: 'Der Rabatt wird von SDeal als Plattform gewährt, nicht von einzelnen Verkäufern. Deshalb funktioniert der Rabatt auch bei allen unseren 300+ angeschlossenen Verkäufern und auf mehr als 1,5 Millionen Produkten.'
        },
        {
          q: 'Gibt es ein Kleingedrucktes?',
          a: 'Nein. Einmalige Zahlung von €14,95. Kein Abonnement. Keine zusätzlichen Kosten. Der Rabatt bleibt gültig, solange Ihr Konto aktiv bleibt und SDeal existiert.'
        },
        {
          q: 'Was passiert, wenn sich SDeal ändert oder eine neue Version erhält?',
          a: 'Sollte sich die Struktur der Plattform ändern, bleibt der Wert Ihres Lifetime Discounts erhalten. Wir werden Ihren Rabatt niemals ohne triftigen Grund beenden und halten uns an das geltende Verbraucherrecht. Wenn sich etwas ändert, informieren wir Sie rechtzeitig.'
        },
        {
          q: 'Was ist, wenn ich mein Konto lösche?',
          a: 'Wenn Sie Ihr Konto selbst löschen, erlischt auch Ihr Lifetime Discount. Wenn Sie ein neues Konto erstellen, ist der Rabatt dort nicht automatisch aktiv.'
        },
        {
          q: 'Kann ich den Rabatt mit anderen teilen?',
          a: 'Nein, der Rabatt ist persönlich und an Ihr SDeal-Konto gebunden. Das Teilen oder Weiterverkaufen des Lifetime Discounts ist nicht erlaubt.'
        },
        {
          q: 'Ist meine Zahlung wirklich einmalig?',
          a: 'Ja. Sie zahlen einmal €14,95 und dann nie wieder. Sie müssen also nicht jährlich oder monatlich zahlen.'
        },
        {
          q: 'Kann ich mein Geld zurückbekommen?',
          a: 'Wenn Sie ein technisches Problem haben, das verhindert, dass der Rabatt funktioniert, werden wir es beheben oder eine angemessene Lösung anbieten. In diesem Fall kontaktieren Sie bitte unseren Kundenservice.'
        },
        {
          q: 'Wie weiß ich, dass der Rabatt aktiv ist?',
          a: 'Innerhalb von 24 Stunden nach der Zahlung ist Ihr Konto aktiv. Wenn Sie dann auf einer der SDeal-Domains einkaufen, erscheint der 7,5% Rabatt automatisch in Ihrem Warenkorb.'
        },
        {
          q: 'Ist dieses Angebot zeitlich begrenzt?',
          a: 'SDeal kann dieses Upgrade in Zukunft ändern oder einstellen, aber wenn Sie es bereits aktiviert haben, bleibt Ihr Lifetime Discount gültig.'
        },
        {
          q: 'Was sind die rechtlichen Bedingungen?',
          a: 'Der Lifetime Discount fällt unter niederländisches Verbraucherrecht und ACM-Richtlinien für klare Preisangaben. Durch die Aktivierung des Upgrades stimmen Sie den oben erläuterten Bedingungen zu. Wir kommunizieren immer transparent, ohne versteckte Kosten oder Kleingedrucktes.'
        },
        {
          q: 'Wo kann ich bei Fragen Hilfe bekommen?',
          a: 'Kontaktieren Sie uns unter info@sdeal.com - wir helfen Ihnen gerne weiter.'
        }
      ]
    },
    fr: {
      title: 'Lifetime Discount Group',
      subtitle: 'Entrez votre adresse e-mail pour sécuriser des réductions à vie sur SDeal',
      emailPlaceholder: 'Votre adresse e-mail',
      emailLabel: 'Adresse e-mail',
      payButton: 'Payer 14,95 €',
      processing: 'Traitement en cours...',
      successTitle: 'Merci d\'avoir rejoint le Lifetime Discount Group',
      successMessage: 'Votre compte sera disponible pour des réductions à vie dans les 24 heures.',
      errorMessage: 'Une erreur s\'est produite. Veuillez réessayer.',
      emailRequired: 'Veuillez entrer votre adresse e-mail',
      emailInvalid: 'Veuillez entrer une adresse e-mail valide',
      faqTitle: 'FAQ – Lifetime Discount (14,95 €)',
      faqSubtitle: 'Réduction à vie de 7,5% sur toutes vos commandes SDeal',
      faq: [
        {
          q: 'Que signifie "réduction à vie"?',
          a: 'Réduction à vie signifie que vous bénéficiez de 7,5% de réduction sur toutes vos commandes pour toujours, tant que SDeal est actif en tant que plateforme et que vous avez un compte client actif. Il n\'y a pas de frais récurrents ou de conditions cachées.'
        },
        {
          q: 'Comment cela fonctionne-t-il exactement?',
          a: 'Après votre paiement unique de 14,95 €, la réduction de 7,5% est automatiquement appliquée à chaque commande que vous passez sur SDeal. Vous verrez la réduction dans votre panier et lors du paiement.'
        },
        {
          q: 'La réduction s\'applique-t-elle à tous les produits?',
          a: 'Oui, la réduction s\'applique à tous les produits sur SDeal, sauf si la page produit indique explicitement qu\'un article est exclu (par exemple, par une action du vendeur).'
        },
        {
          q: 'Qui offre cette réduction : SDeal ou le vendeur?',
          a: 'La réduction est fournie par SDeal en tant que plateforme, et non par des vendeurs individuels. C\'est pourquoi la réduction fonctionne avec tous nos 300+ vendeurs connectés et sur plus de 1,5 million de produits.'
        },
        {
          q: 'Y a-t-il des petits caractères?',
          a: 'Non. Paiement unique de 14,95 €. Pas d\'abonnement. Pas de frais supplémentaires. La réduction reste valable tant que votre compte reste actif et que SDeal existe.'
        },
        {
          q: 'Que se passe-t-il si SDeal change ou obtient une nouvelle version?',
          a: 'Si la structure de la plateforme change, la valeur de votre Lifetime Discount reste intacte. Nous ne mettrons jamais fin à votre réduction sans bonne raison et nous respectons la législation applicable en matière de consommation. Si quelque chose change, nous vous informerons à temps.'
        },
        {
          q: 'Que se passe-t-il si je supprime mon compte?',
          a: 'Si vous supprimez vous-même votre compte, votre Lifetime Discount expirera également. Si vous créez un nouveau compte, la réduction ne sera pas automatiquement dessus.'
        },
        {
          q: 'Puis-je partager la réduction avec d\'autres?',
          a: 'Non, la réduction est personnelle et liée à votre compte SDeal. Le partage ou la revente du Lifetime Discount n\'est pas autorisé.'
        },
        {
          q: 'Mon paiement est-il vraiment unique?',
          a: 'Oui. Vous payez une fois 14,95 € et ensuite plus jamais. Vous n\'avez donc pas à payer annuellement ou mensuellement.'
        },
        {
          q: 'Puis-je récupérer mon argent?',
          a: 'Si vous avez un problème technique qui empêche la réduction de fonctionner, nous le résoudrons ou proposerons une solution appropriée. Dans ce cas, veuillez contacter notre service client.'
        },
        {
          q: 'Comment savoir que la réduction est active?',
          a: 'Dans les 24 heures suivant le paiement, votre compte est actif. Lorsque vous faites ensuite vos achats sur l\'un des noms de domaine SDeal, la réduction de 7,5% apparaîtra automatiquement dans votre panier.'
        },
        {
          q: 'Cette offre est-elle temporaire?',
          a: 'SDeal peut modifier ou arrêter cette mise à niveau à l\'avenir, mais si vous l\'avez déjà activée, votre Lifetime Discount restera valide.'
        },
        {
          q: 'Quelles sont les conditions légales?',
          a: 'Le Lifetime Discount relève du droit de la consommation néerlandais et des directives ACM pour une communication claire des prix. En activant la mise à niveau, vous acceptez les conditions telles qu\'expliquées ci-dessus. Nous communiquons toujours de manière transparente, sans frais cachés ou petits caractères.'
        },
        {
          q: 'Où puis-je obtenir de l\'aide pour mes questions?',
          a: 'Contactez-nous à info@sdeal.com - nous sommes heureux de vous aider.'
        }
      ]
    }
  };

  const t = translations[currentLanguage] || translations.en;

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const toggleFAQ = (index) => {
    setOpenFAQ(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t.emailRequired);
      return;
    }

    if (!validateEmail(email)) {
      setError(t.emailInvalid);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/lifetime-discount/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, language: currentLanguage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorMessage);
      }

      if (data.paymentUrl) {
        // Redirect to Mollie payment page
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(t.errorMessage);
      }
    } catch (err) {
      setError(err.message || t.errorMessage);
      setLoading(false);
    }
  };

  // Show success page if payment was successful
  if (paymentStatus === 'success') {
    return (
      <div className="lifetime-discount-page">
        <SEOHead 
          title={t.successTitle}
          description={t.successMessage}
        />
        <div className="container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>{t.successTitle}</h1>
            <p>{t.successMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lifetime-discount-page">
      <SEOHead 
        title={t.title}
        description={t.subtitle}
      />
      <div className="container">
        <div className="lifetime-discount-content">
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
          
          <form onSubmit={handleSubmit} className="lifetime-discount-form">
            <div className="form-group">
              <label htmlFor="email">{t.emailLabel}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                disabled={loading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="pay-button"
              disabled={loading}
            >
              {loading ? t.processing : t.payButton}
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2 className="faq-title">{t.faqTitle}</h2>
          <p className="faq-subtitle">{t.faqSubtitle}</p>
          
          <div className="faq-list">
            {t.faq && t.faq.map((item, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${openFAQ[index] ? 'open' : ''}`}
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{item.q}</span>
                  <span className="faq-icon">{openFAQ[index] ? '−' : '+'}</span>
                </button>
                {openFAQ[index] && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifetimeDiscountGroup;

