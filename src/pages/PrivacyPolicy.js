import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
      <div className="w3-container w3-padding-64">
        <h1>Privacy Policy</h1>
        <p>Last updated: [Date]</p>
        
        <section>
          <h2>1. Introduction</h2>
          <p>
            SDeal ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide to us, including:</p>
          <ul>
            <li>Name and contact information</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Company information</li>
            <li>Any other information you choose to provide</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you visit our website, we may automatically collect certain information, including:</p>
          <ul>
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages visited</li>
            <li>Time spent on pages</li>
            <li>Referring website</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Process transactions</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Respond to your inquiries</li>
            <li>Improve our website and services</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Information Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:</p>
          <ul>
            <li>To trusted third-party service providers who assist us in operating our website and providing services</li>
            <li>To comply with legal requirements</li>
            <li>To protect our rights and safety</li>
            <li>In connection with a business transfer or merger</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to processing of your information</li>
            <li>Withdraw consent for marketing communications</li>
          </ul>
        </section>

        <section>
          <h2>7. Cookies</h2>
          <p>
            We use cookies and similar technologies to enhance your browsing experience and analyze website traffic. You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section>
          <h2>8. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
          </p>
        </section>

        <section>
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:privacy@sdeal.com">privacy@sdeal.com</a><br />
            Address: SDeal BV<br />
            Osloweg 110<br />
            9723 BX Groningen<br />
            Netherlands
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 