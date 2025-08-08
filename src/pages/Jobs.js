import React, { useState } from 'react';
import SEOHead from '../components/SEOHead';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../translations/translations';
import './Jobs.css';

const Jobs = () => {
  const { currentLanguage } = useLanguage();
  const [selectedJob, setSelectedJob] = useState(null);

  const jobs = [
    {
      id: 'senior-developer',
      title: {
        en: 'Senior Developer',
        nl: 'Senior Developer',
        de: 'Senior Entwickler',
        fr: 'Développeur Senior'
      },
      category: 'Full-time',
      location: 'Groningen, Netherlands',
      type: 'Remote/Hybrid',
      salary: '€3,500 - €5,500',
      description: {
        en: 'We are looking for a Senior Developer to maintain and implement our platform using Magento. You will add functionalities and modules and implement integrations with business processes.',
        nl: 'We zijn op zoek naar een Senior Developer om ons platform te onderhouden en implementeren met Magento. Je voegt functionaliteiten en modules toe en implementeert integraties met bedrijfsprocessen.',
        de: 'Wir suchen einen Senior Entwickler zur Wartung und Implementierung unserer Plattform mit Magento. Sie fügen Funktionalitäten und Module hinzu und implementieren Integrationen mit Geschäftsprozessen.',
        fr: 'Nous recherchons un Développeur Senior pour maintenir et implémenter notre plateforme en utilisant Magento. Vous ajouterez des fonctionnalités et des modules et implémenterez des intégrations avec les processus métier.'
      },
      responsibilities: {
        en: [
          'Object-oriented development in PHP',
          'Modular maintenance and implementation of new innovations',
          'Developing and testing web applications',
          'Adding functionalities and modules and integrating with business processes',
          'Senior development responsibilities',
          'Contributing to the company\'s technical vision and optimizing all ICT-related activities',
          'Providing input on technical developments in the market',
          'Providing technical guidance and direction to our developers abroad'
        ],
        nl: [
          'Object-georiënteerde ontwikkeling in PHP',
          'Modulaire onderhoud en implementatie van nieuwe innovaties',
          'Ontwikkelen en testen van webapplicaties',
          'Toevoegen van functionaliteiten en modules en integreren met bedrijfsprocessen',
          'Senior development verantwoordelijkheden',
          'Bijdragen aan de technische visie van het bedrijf en optimaliseren van alle ICT-gerelateerde activiteiten',
          'Input leveren over technische ontwikkelingen in de markt',
          'Technische begeleiding en richting geven aan onze ontwikkelaars in het buitenland'
        ],
        de: [
          'Objektorientierte Entwicklung in PHP',
          'Modulare Wartung und Implementierung neuer Innovationen',
          'Entwicklung und Testen von Webanwendungen',
          'Hinzufügen von Funktionalitäten und Modulen und Integration mit Geschäftsprozessen',
          'Senior-Entwicklungsverantwortlichkeiten',
          'Beitrag zur technischen Vision des Unternehmens und Optimierung aller ICT-bezogenen Aktivitäten',
          'Input zu technischen Entwicklungen im Markt',
          'Technische Anleitung und Führung unserer Entwickler im Ausland'
        ],
        fr: [
          'Développement orienté objet en PHP',
          'Maintenance modulaire et implémentation de nouvelles innovations',
          'Développement et test d\'applications web',
          'Ajout de fonctionnalités et modules et intégration avec les processus métier',
          'Responsabilités de développement senior',
          'Contribution à la vision technique de l\'entreprise et optimisation de toutes les activités liées aux TIC',
          'Apport d\'informations sur les développements techniques du marché',
          'Guidance technique et direction de nos développeurs à l\'étranger'
        ]
      },
      requirements: {
        en: [
          'Bachelor\'s or Master\'s degree (ICT-related)',
          'Relevant work experience (from previous jobs and/or internships)',
          'Proven experience with object-oriented PHP development',
          'Extensive knowledge of Magento is a plus',
          'Experience with version control systems',
          'Affinity with E-commerce is a plus',
          'Accuracy and problem-solving skills',
          'Strong analytical abilities',
          'Excellent communication skills',
          'Strong work ethic'
        ],
        nl: [
          'Bachelor- of Masterdiploma (ICT-gerelateerd)',
          'Relevante werkervaring (van eerdere banen en/of stages)',
          'Bewezen ervaring met object-georiënteerde PHP-ontwikkeling',
          'Uitgebreide kennis van Magento is een plus',
          'Ervaring met versiebeheersystemen',
          'Affiniteit met E-commerce is een plus',
          'Nauwkeurigheid en probleemoplossende vaardigheden',
          'Sterke analytische vaardigheden',
          'Uitstekende communicatieve vaardigheden',
          'Sterke werkethiek'
        ],
        de: [
          'Bachelor- oder Master-Abschluss (ICT-bezogen)',
          'Relevante Arbeitserfahrung (aus früheren Jobs und/oder Praktika)',
          'Nachgewiesene Erfahrung mit objektorientierter PHP-Entwicklung',
          'Umfassende Magento-Kenntnisse sind ein Plus',
          'Erfahrung mit Versionskontrollsystemen',
          'Affinität zu E-Commerce ist ein Plus',
          'Genauigkeit und Problemlösungsfähigkeiten',
          'Starke analytische Fähigkeiten',
          'Ausgezeichnete Kommunikationsfähigkeiten',
          'Starke Arbeitsethik'
        ],
        fr: [
          'Diplôme de licence ou de master (lié aux TIC)',
          'Expérience de travail pertinente (de postes précédents et/ou stages)',
          'Expérience prouvée en développement PHP orienté objet',
          'Connaissance approfondie de Magento est un plus',
          'Expérience avec les systèmes de contrôle de version',
          'Affinité avec l\'E-commerce est un plus',
          'Précision et compétences en résolution de problèmes',
          'Fortes capacités analytiques',
          'Excellentes compétences en communication',
          'Forte éthique de travail'
        ]
      },
      benefits: {
        en: [
          'A role with full freedom and responsibility',
          'Being part of a fast-growing startup with international ambitions',
          'Flexible remote working',
          'On-the-job training to help you grow',
          'Base salary depending on education and experience',
          'Opportunity to acquire a stake in the company'
        ],
        nl: [
          'Een rol met volledige vrijheid en verantwoordelijkheid',
          'Deel uitmaken van een snelgroeiende startup met internationale ambities',
          'Flexibel thuiswerken',
          'On-the-job training om je te helpen groeien',
          'Basissalaris afhankelijk van opleiding en ervaring',
          'Mogelijkheid om een aandeel in het bedrijf te verwerven'
        ],
        de: [
          'Eine Rolle mit voller Freiheit und Verantwortung',
          'Teil eines schnell wachsenden Startups mit internationalen Ambitionen',
          'Flexibles Remote-Arbeiten',
          'On-the-Job-Training zur Unterstützung Ihres Wachstums',
          'Grundgehalt je nach Ausbildung und Erfahrung',
          'Möglichkeit, einen Anteil am Unternehmen zu erwerben'
        ],
        fr: [
          'Un rôle avec liberté et responsabilité complètes',
          'Faire partie d\'une startup en croissance rapide avec des ambitions internationales',
          'Travail flexible à distance',
          'Formation en cours d\'emploi pour vous aider à grandir',
          'Salaire de base selon l\'éducation et l\'expérience',
          'Opportunité d\'acquérir une participation dans l\'entreprise'
        ]
      }
    },
         {
       id: 'office-manager',
       title: {
         en: 'Office Manager',
         nl: 'Office Manager',
         de: 'Büroleiter',
         fr: 'Responsable de Bureau'
       },
       category: 'Full-time',
       location: 'Groningen, Netherlands',
       type: 'On-site',
       salary: '€2,500 - €3,500',
       description: {
         en: 'We are looking for an organized and proactive Office Manager to ensure smooth daily operations and support our growing team.',
         nl: 'We zijn op zoek naar een georganiseerde en proactieve Office Manager om soepele dagelijkse operaties te waarborgen en ons groeiende team te ondersteunen.',
         de: 'Wir suchen einen organisierten und proaktiven Büroleiter, um reibungslose tägliche Abläufe zu gewährleisten und unser wachsendes Team zu unterstützen.',
         fr: 'Nous recherchons un Responsable de Bureau organisé et proactif pour assurer des opérations quotidiennes fluides et soutenir notre équipe en croissance.'
       },
      responsibilities: {
        en: [
          'Manage office operations and administrative tasks',
          'Coordinate meetings and events',
          'Handle correspondence and communications',
          'Support HR and recruitment processes',
          'Manage office supplies and equipment',
          'Coordinate with external vendors and service providers'
        ],
        nl: [
          'Beheren van kantooroperaties en administratieve taken',
          'Coördineren van vergaderingen en evenementen',
          'Afhandelen van correspondentie en communicatie',
          'Ondersteunen van HR- en wervingsprocessen',
          'Beheren van kantoorbenodigdheden en apparatuur',
          'Coördineren met externe leveranciers en dienstverleners'
        ],
        de: [
          'Verwaltung von Büroabläufen und administrativen Aufgaben',
          'Koordination von Meetings und Veranstaltungen',
          'Bearbeitung von Korrespondenz und Kommunikation',
          'Unterstützung von HR- und Rekrutierungsprozessen',
          'Verwaltung von Büromaterial und Ausrüstung',
          'Koordination mit externen Lieferanten und Dienstleistern'
        ],
        fr: [
          'Gérer les opérations de bureau et les tâches administratives',
          'Coordonner les réunions et événements',
          'Gérer la correspondance et les communications',
          'Soutenir les processus RH et de recrutement',
          'Gérer les fournitures et équipements de bureau',
          'Coordonner avec les fournisseurs et prestataires externes'
        ]
      },
      requirements: {
        en: [
          'Bachelor\'s degree in Business Administration or related field',
          '2+ years of office management experience',
          'Excellent organizational and multitasking skills',
          'Strong communication and interpersonal abilities',
          'Proficiency in Microsoft Office Suite',
          'Attention to detail and problem-solving skills'
        ],
        nl: [
          'Bachelor-diploma in Bedrijfskunde of gerelateerd vakgebied',
          '2+ jaar ervaring in kantoorbeheer',
          'Uitstekende organisatorische en multitasking vaardigheden',
          'Sterke communicatieve en interpersoonlijke vaardigheden',
          'Vaardigheid in Microsoft Office Suite',
          'Oog voor detail en probleemoplossende vaardigheden'
        ],
        de: [
          'Bachelor-Abschluss in Betriebswirtschaft oder verwandtem Bereich',
          '2+ Jahre Büromanagement-Erfahrung',
          'Ausgezeichnete organisatorische und Multitasking-Fähigkeiten',
          'Starke Kommunikations- und zwischenmenschliche Fähigkeiten',
          'Beherrschung der Microsoft Office Suite',
          'Sorgfalt und Problemlösungsfähigkeiten'
        ],
        fr: [
          'Diplôme de licence en administration des affaires ou domaine connexe',
          '2+ années d\'expérience en gestion de bureau',
          'Excellentes compétences organisationnelles et de multitâche',
          'Fortes capacités de communication et interpersonnelles',
          'Maîtrise de la suite Microsoft Office',
          'Attention aux détails et compétences en résolution de problèmes'
        ]
      },
      benefits: {
        en: [
          'Competitive salary package',
          'Professional development opportunities',
          'Collaborative work environment',
          'Health and wellness benefits',
          'Modern office facilities'
        ],
        nl: [
          'Concurrerend salaris pakket',
          'Professionele ontwikkelingsmogelijkheden',
          'Samenwerkende werkomgeving',
          'Gezondheids- en welzijnsvoorzieningen',
          'Moderne kantoorfaciliteiten'
        ],
        de: [
          'Wettbewerbsfähiges Gehaltspaket',
          'Professionelle Entwicklungsmöglichkeiten',
          'Kollaborative Arbeitsumgebung',
          'Gesundheits- und Wellness-Vorteile',
          'Moderne Büroeinrichtungen'
        ],
        fr: [
          'Package salarial concurrentiel',
          'Opportunités de développement professionnel',
          'Environnement de travail collaboratif',
          'Avantages santé et bien-être',
          'Installations de bureau modernes'
        ]
      }
    },
         {
       id: 'traineeship-sales',
       title: {
         en: 'Traineeship Sales',
         nl: 'Traineeship Sales',
         de: 'Traineeship Vertrieb',
         fr: 'Stage Commercial'
       },
       category: 'Traineeship',
       location: 'Groningen, Netherlands',
       type: 'Hybrid',
       salary: '€1,800 - €2,200',
       description: {
         en: 'Join our sales team and learn the ins and outs of B2B sales in the e-commerce industry. Perfect for recent graduates looking to start their career.',
         nl: 'Sluit je aan bij ons sales team en leer de ins en outs van B2B verkoop in de e-commerce industrie. Perfect voor recent afgestudeerden die hun carrière willen starten.',
         de: 'Schließen Sie sich unserem Vertriebsteam an und lernen Sie die Feinheiten des B2B-Verkaufs in der E-Commerce-Branche kennen. Perfekt für kürzlich Absolventen, die ihre Karriere starten möchten.',
         fr: 'Rejoignez notre équipe commerciale et apprenez les rouages de la vente B2B dans l\'industrie du e-commerce. Parfait pour les diplômés récents qui souhaitent commencer leur carrière.'
       },
      responsibilities: {
        en: [
          'Learn and understand our product portfolio',
          'Support senior sales representatives',
          'Participate in sales training and workshops',
          'Assist with lead generation and qualification',
          'Learn CRM systems and sales processes',
          'Contribute to sales strategy development'
        ],
        nl: [
          'Leren en begrijpen van ons productportfolio',
          'Ondersteunen van senior sales vertegenwoordigers',
          'Deelnemen aan sales trainingen en workshops',
          'Assisteren bij lead generatie en kwalificatie',
          'Leren van CRM-systemen en sales processen',
          'Bijdragen aan sales strategie ontwikkeling'
        ],
        de: [
          'Lernen und Verstehen unseres Produktportfolios',
          'Unterstützung von Senior-Vertriebsmitarbeitern',
          'Teilnahme an Vertriebsschulungen und Workshops',
          'Unterstützung bei Lead-Generierung und -Qualifizierung',
          'Lernen von CRM-Systemen und Vertriebsprozessen',
          'Beitrag zur Vertriebsstrategie-Entwicklung'
        ],
        fr: [
          'Apprendre et comprendre notre portefeuille de produits',
          'Soutenir les représentants commerciaux seniors',
          'Participer aux formations et ateliers de vente',
          'Aider à la génération et qualification de prospects',
          'Apprendre les systèmes CRM et processus de vente',
          'Contribuer au développement de la stratégie commerciale'
        ]
      },
      requirements: {
        en: [
          'Bachelor\'s degree in Business, Marketing, or related field',
          'Strong interest in sales and business development',
          'Excellent communication and presentation skills',
          'Self-motivated and eager to learn',
          'Team player with positive attitude',
          'Fluent in Dutch and English'
        ],
        nl: [
          'Bachelor-diploma in Bedrijfskunde, Marketing of gerelateerd vakgebied',
          'Sterke interesse in sales en business development',
          'Uitstekende communicatieve en presentatievaardigheden',
          'Zelfgemotiveerd en leergierig',
          'Teamspeler met positieve houding',
          'Vloeiend in Nederlands en Engels'
        ],
        de: [
          'Bachelor-Abschluss in Betriebswirtschaft, Marketing oder verwandtem Bereich',
          'Starkes Interesse an Vertrieb und Geschäftsentwicklung',
          'Ausgezeichnete Kommunikations- und Präsentationsfähigkeiten',
          'Selbstmotiviert und lernbegierig',
          'Teamplayer mit positiver Einstellung',
          'Fließend in Niederländisch und Englisch'
        ],
        fr: [
          'Diplôme de licence en commerce, marketing ou domaine connexe',
          'Fort intérêt pour la vente et le développement commercial',
          'Excellentes compétences en communication et présentation',
          'Autonome et désireux d\'apprendre',
          'Joueur d\'équipe avec une attitude positive',
          'Courant en néerlandais et anglais'
        ]
      },
      benefits: {
        en: [
          'Comprehensive sales training program',
          'Mentorship from experienced sales professionals',
          'Potential for permanent position after traineeship',
          'Competitive traineeship allowance',
          'Real-world experience in fast-growing company'
        ],
        nl: [
          'Uitgebreid sales trainingsprogramma',
          'Mentorschap van ervaren sales professionals',
          'Potentieel voor vaste positie na traineeship',
          'Concurrerende traineeship vergoeding',
          'Praktische ervaring in snelgroeiend bedrijf'
        ],
        de: [
          'Umfassendes Vertriebsschulungsprogramm',
          'Mentoring von erfahrenen Vertriebsprofis',
          'Potenzial für Festanstellung nach dem Traineeship',
          'Wettbewerbsfähige Traineeship-Vergütung',
          'Praktische Erfahrung in schnell wachsendem Unternehmen'
        ],
        fr: [
          'Programme de formation commerciale complet',
          'Mentorat de professionnels de vente expérimentés',
          'Potentiel de poste permanent après le stage',
          'Indemnité de stage concurrentielle',
          'Expérience pratique dans une entreprise en croissance rapide'
        ]
      }
    },
         {
       id: 'traineeship-finance',
       title: {
         en: 'Traineeship Finance',
         nl: 'Traineeship Finance',
         de: 'Traineeship Finanzen',
         fr: 'Stage Finance'
       },
       category: 'Traineeship',
       location: 'Groningen, Netherlands',
       type: 'Hybrid',
       salary: '€1,800 - €2,200',
       description: {
         en: 'Gain hands-on experience in financial operations and learn about e-commerce finance in a dynamic startup environment.',
         nl: 'Krijg praktische ervaring in financiële operaties en leer over e-commerce financiën in een dynamische startup omgeving.',
         de: 'Erhalten Sie praktische Erfahrung in Finanzoperationen und lernen Sie über E-Commerce-Finanzen in einer dynamischen Startup-Umgebung.',
         fr: 'Acquérez une expérience pratique dans les opérations financières et apprenez la finance e-commerce dans un environnement startup dynamique.'
       },
      responsibilities: {
        en: [
          'Assist with financial reporting and analysis',
          'Learn about e-commerce payment processing',
          'Support accounts payable and receivable processes',
          'Participate in budgeting and forecasting activities',
          'Learn about financial compliance and regulations',
          'Assist with financial data entry and reconciliation'
        ],
        nl: [
          'Assisteren bij financiële rapportage en analyse',
          'Leren over e-commerce betalingsverwerking',
          'Ondersteunen van crediteuren- en debiteurenprocessen',
          'Deelnemen aan budgettering en prognose activiteiten',
          'Leren over financiële compliance en regelgeving',
          'Assisteren bij financiële data-invoer en reconciliatie'
        ],
        de: [
          'Unterstützung bei Finanzberichterstattung und -analyse',
          'Lernen über E-Commerce-Zahlungsabwicklung',
          'Unterstützung von Kreditoren- und Debitorenprozessen',
          'Teilnahme an Budgetierungs- und Prognoseaktivitäten',
          'Lernen über Finanzcompliance und -vorschriften',
          'Unterstützung bei Finanzdaten-Eingabe und -Abstimmung'
        ],
        fr: [
          'Aider aux rapports et analyses financiers',
          'Apprendre le traitement des paiements e-commerce',
          'Soutenir les processus de comptes fournisseurs et clients',
          'Participer aux activités de budgétisation et prévision',
          'Apprendre la conformité et réglementation financières',
          'Aider à la saisie et réconciliation des données financières'
        ]
      },
      requirements: {
        en: [
          'Bachelor\'s degree in Finance, Accounting, or related field',
          'Strong analytical and numerical skills',
          'Attention to detail and accuracy',
          'Proficiency in Excel and financial software',
          'Interest in e-commerce and fintech',
          'Fluent in Dutch and English'
        ],
        nl: [
          'Bachelor-diploma in Financiën, Accountancy of gerelateerd vakgebied',
          'Sterke analytische en numerieke vaardigheden',
          'Oog voor detail en nauwkeurigheid',
          'Vaardigheid in Excel en financiële software',
          'Interesse in e-commerce en fintech',
          'Vloeiend in Nederlands en Engels'
        ],
        de: [
          'Bachelor-Abschluss in Finanzen, Rechnungswesen oder verwandtem Bereich',
          'Starke analytische und numerische Fähigkeiten',
          'Sorgfalt und Genauigkeit',
          'Beherrschung von Excel und Finanzsoftware',
          'Interesse an E-Commerce und Fintech',
          'Fließend in Niederländisch und Englisch'
        ],
        fr: [
          'Diplôme de licence en finance, comptabilité ou domaine connexe',
          'Fortes compétences analytiques et numériques',
          'Attention aux détails et précision',
          'Maîtrise d\'Excel et des logiciels financiers',
          'Intérêt pour l\'e-commerce et la fintech',
          'Courant en néerlandais et anglais'
        ]
      },
      benefits: {
        en: [
          'Comprehensive finance training program',
          'Exposure to e-commerce financial operations',
          'Mentorship from experienced finance professionals',
          'Potential for permanent position after traineeship',
          'Competitive traineeship allowance'
        ],
        nl: [
          'Uitgebreid financieel trainingsprogramma',
          'Blootstelling aan e-commerce financiële operaties',
          'Mentorschap van ervaren financiële professionals',
          'Potentieel voor vaste positie na traineeship',
          'Concurrerende traineeship vergoeding'
        ],
        de: [
          'Umfassendes Finanzschulungsprogramm',
          'Einblick in E-Commerce-Finanzoperationen',
          'Mentoring von erfahrenen Finanzprofis',
          'Potenzial für Festanstellung nach dem Traineeship',
          'Wettbewerbsfähige Traineeship-Vergütung'
        ],
        fr: [
          'Programme de formation financière complet',
          'Exposition aux opérations financières e-commerce',
          'Mentorat de professionnels de la finance expérimentés',
          'Potentiel de poste permanent après le stage',
          'Indemnité de stage concurrentielle'
        ]
      }
    },
         {
       id: 'traineeship-data-content',
       title: {
         en: 'Traineeship Data Content',
         nl: 'Traineeship Data Content',
         de: 'Traineeship Daten & Content',
         fr: 'Stage Données & Contenu'
       },
       category: 'Traineeship',
       location: 'Groningen, Netherlands',
       type: 'Hybrid',
       salary: '€1,800 - €2,200',
       description: {
         en: 'Learn about data management and content optimization in the e-commerce industry. Perfect for data enthusiasts and content creators.',
         nl: 'Leer over data management en content optimalisatie in de e-commerce industrie. Perfect voor data enthousiastelingen en content creators.',
         de: 'Lernen Sie über Datenmanagement und Content-Optimierung in der E-Commerce-Branche. Perfekt für Datenenthusiasten und Content Creator.',
         fr: 'Apprenez la gestion des données et l\'optimisation du contenu dans l\'industrie du e-commerce. Parfait pour les passionnés de données et les créateurs de contenu.'
       },
      responsibilities: {
        en: [
          'Assist with product data management and optimization',
          'Learn about content creation and SEO',
          'Support data analysis and reporting',
          'Participate in content strategy development',
          'Learn about e-commerce platforms and tools',
          'Assist with product catalog management'
        ],
        nl: [
          'Assisteren bij productdata management en optimalisatie',
          'Leren over content creatie en SEO',
          'Ondersteunen van data analyse en rapportage',
          'Deelnemen aan content strategie ontwikkeling',
          'Leren over e-commerce platforms en tools',
          'Assisteren bij productcatalogus beheer'
        ],
        de: [
          'Unterstützung bei Produktdatenmanagement und -optimierung',
          'Lernen über Content-Erstellung und SEO',
          'Unterstützung bei Datenanalyse und -berichterstattung',
          'Teilnahme an Content-Strategie-Entwicklung',
          'Lernen über E-Commerce-Plattformen und -Tools',
          'Unterstützung beim Produktkatalog-Management'
        ],
        fr: [
          'Aider à la gestion et optimisation des données produits',
          'Apprendre la création de contenu et le SEO',
          'Soutenir l\'analyse et la reporting des données',
          'Participer au développement de la stratégie de contenu',
          'Apprendre les plateformes et outils e-commerce',
          'Aider à la gestion du catalogue produits'
        ]
      },
      requirements: {
        en: [
          'Bachelor\'s degree in Data Science, Marketing, or related field',
          'Strong analytical and creative skills',
          'Interest in e-commerce and digital marketing',
          'Proficiency in Excel and data analysis tools',
          'Good writing and communication skills',
          'Fluent in Dutch and English'
        ],
        nl: [
          'Bachelor-diploma in Data Science, Marketing of gerelateerd vakgebied',
          'Sterke analytische en creatieve vaardigheden',
          'Interesse in e-commerce en digital marketing',
          'Vaardigheid in Excel en data analyse tools',
          'Goede schrijf- en communicatieve vaardigheden',
          'Vloeiend in Nederlands en Engels'
        ],
        de: [
          'Bachelor-Abschluss in Data Science, Marketing oder verwandtem Bereich',
          'Starke analytische und kreative Fähigkeiten',
          'Interesse an E-Commerce und Digital Marketing',
          'Beherrschung von Excel und Datenanalysetools',
          'Gute Schreib- und Kommunikationsfähigkeiten',
          'Fließend in Niederländisch und Englisch'
        ],
        fr: [
          'Diplôme de licence en science des données, marketing ou domaine connexe',
          'Fortes compétences analytiques et créatives',
          'Intérêt pour l\'e-commerce et le marketing digital',
          'Maîtrise d\'Excel et des outils d\'analyse de données',
          'Bonnes compétences en rédaction et communication',
          'Courant en néerlandais et anglais'
        ]
      },
      benefits: {
        en: [
          'Comprehensive data and content training program',
          'Exposure to e-commerce data operations',
          'Mentorship from experienced professionals',
          'Potential for permanent position after traineeship',
          'Competitive traineeship allowance'
        ],
        nl: [
          'Uitgebreid data en content trainingsprogramma',
          'Blootstelling aan e-commerce data operaties',
          'Mentorschap van ervaren professionals',
          'Potentieel voor vaste positie na traineeship',
          'Concurrerende traineeship vergoeding'
        ],
        de: [
          'Umfassendes Daten- und Content-Schulungsprogramm',
          'Einblick in E-Commerce-Datenoperationen',
          'Mentoring von erfahrenen Profis',
          'Potenzial für Festanstellung nach dem Traineeship',
          'Wettbewerbsfähige Traineeship-Vergütung'
        ],
        fr: [
          'Programme de formation complet en données et contenu',
          'Exposition aux opérations de données e-commerce',
          'Mentorat de professionnels expérimentés',
          'Potentiel de poste permanent après le stage',
          'Indemnité de stage concurrentielle'
        ]
      }
    }
  ];

  const openJobDetails = (job) => {
    setSelectedJob(job);
  };

  const closeJobDetails = () => {
    setSelectedJob(null);
  };

  // Minimal JobPosting structured data for the first listed full-time role
  const firstJob = jobs.find(j => j.category === 'Full-time');
  const jobStructuredData = firstJob ? {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: (firstJob.title[currentLanguage] || firstJob.title.en),
    description: (firstJob.description[currentLanguage] || firstJob.description.en),
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Groningen',
        addressCountry: 'NL'
      }
    },
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'SDeal',
      sameAs: 'https://www.sdeal.com'
    }
  } : null;

  return (
    <div className="jobs-container">
      <SEOHead 
        type="website" 
        description="Join SDeal's growing team in Groningen. Explore career opportunities in development, sales, finance, and data content. Remote and hybrid positions available."
        keywords="SDeal careers, jobs Groningen, developer positions, sales traineeship, finance jobs, remote work, startup careers"
        structuredData={jobStructuredData} 
      />
      <div className="w3-content w3-padding-64">
                 <h1 className="w3-center">{getTranslation(currentLanguage, 'joinOurTeam')}</h1>
         
         <div className="jobs-intro">
           <p className="w3-center w3-large">
             {getTranslation(currentLanguage, 'jobsIntro')}
           </p>
         </div>

         <div className="jobs-categories">
           <div className="category-section">
             <h2>{getTranslation(currentLanguage, 'fullTimePositions')}</h2>
            <div className="jobs-grid">
              {jobs.filter(job => job.category === 'Full-time').map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3 className="job-title">{job.title[currentLanguage] || job.title.en}</h3>
                    <span className="job-category">{job.category}</span>
                  </div>
                  <div className="job-details">
                    <div className="job-info">
                      <span><i className="fa fa-map-marker"></i> {job.location}</span>
                      <span><i className="fa fa-clock-o"></i> {job.type}</span>
                      <span><i className="fa fa-euro"></i> {job.salary}</span>
                    </div>
                    <p className="job-description">{job.description[currentLanguage] || job.description.en}</p>
                                         <button 
                       className="apply-button"
                       onClick={() => openJobDetails(job)}
                     >
                       {getTranslation(currentLanguage, 'viewDetails')}
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           <div className="category-section">
             <h2>{getTranslation(currentLanguage, 'traineeships')}</h2>
             <p className="traineeship-intro">
               {getTranslation(currentLanguage, 'traineeshipIntro')}
             </p>
            <div className="jobs-grid">
              {jobs.filter(job => job.category === 'Traineeship').map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3 className="job-title">{job.title[currentLanguage] || job.title.en}</h3>
                    <span className="job-category">{job.category}</span>
                  </div>
                  <div className="job-details">
                    <div className="job-info">
                      <span><i className="fa fa-map-marker"></i> {job.location}</span>
                      <span><i className="fa fa-clock-o"></i> {job.type}</span>
                      <span><i className="fa fa-euro"></i> {job.salary}</span>
                    </div>
                    <p className="job-description">{job.description[currentLanguage] || job.description.en}</p>
                                         <button 
                       className="apply-button"
                       onClick={() => openJobDetails(job)}
                     >
                       {getTranslation(currentLanguage, 'viewDetails')}
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

                 <div className="contact-section">
           <div className="w3-center w3-padding-32">
             <h3>{getTranslation(currentLanguage, 'interestedInJoining')}</h3>
             <p>
               {getTranslation(currentLanguage, 'contactUsJobs')}{' '}
               <a href="mailto:jobs@sdeal.com">jobs@sdeal.com</a>.
             </p>
           </div>
         </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="job-modal-overlay" onClick={closeJobDetails}>
          <div className="job-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeJobDetails}>
              <i className="fa fa-times"></i>
            </button>
            
            <div className="modal-header">
              <h2>{selectedJob.title[currentLanguage] || selectedJob.title.en}</h2>
              <div className="modal-job-info">
                <span><i className="fa fa-map-marker"></i> {selectedJob.location}</span>
                <span><i className="fa fa-clock-o"></i> {selectedJob.type}</span>
                <span><i className="fa fa-euro"></i> {selectedJob.salary}</span>
              </div>
            </div>

            <div className="modal-content">
              <p className="modal-description">{selectedJob.description[currentLanguage] || selectedJob.description.en}</p>

                             <div className="modal-section">
                 <h3>{getTranslation(currentLanguage, 'keyResponsibilities')}</h3>
                 <ul>
                   {(selectedJob.responsibilities[currentLanguage] || selectedJob.responsibilities.en).map((item, index) => (
                     <li key={index}>{item}</li>
                   ))}
                 </ul>
               </div>

               <div className="modal-section">
                 <h3>{getTranslation(currentLanguage, 'requirements')}</h3>
                 <ul>
                   {(selectedJob.requirements[currentLanguage] || selectedJob.requirements.en).map((item, index) => (
                     <li key={index}>{item}</li>
                   ))}
                 </ul>
               </div>

               <div className="modal-section">
                 <h3>{getTranslation(currentLanguage, 'whatWeOffer')}</h3>
                 <ul>
                   {(selectedJob.benefits[currentLanguage] || selectedJob.benefits.en).map((item, index) => (
                     <li key={index}>{item}</li>
                   ))}
                 </ul>
               </div>
            </div>

            <div className="modal-footer">
                             <a 
                 href={`mailto:jobs@sdeal.com?subject=Application for ${selectedJob.title} position`}
                 className="apply-button-large"
               >
                 {getTranslation(currentLanguage, 'applyNow')}
               </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs; 