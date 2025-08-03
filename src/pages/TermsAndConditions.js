import React from 'react';
import './TermsAndConditions.css';

const TermsAndConditions = () => {
  return (
    <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
      <div className="w3-container w3-padding-64">
        <h1>Terms and Conditions</h1>
        <p>Last updated: [Date]</p>
        
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the SDeal website and services, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on SDeal's website for personal, non-commercial transitory viewing only.
          </p>
          <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on the website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section>
          <h2>3. Disclaimer</h2>
          <p>
            The materials on SDeal's website are provided on an 'as is' basis. SDeal makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2>4. Limitations</h2>
          <p>
            In no event shall SDeal or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SDeal's website, even if SDeal or a SDeal authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section>
          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on SDeal's website could include technical, typographical, or photographic errors. SDeal does not warrant that any of the materials on its website are accurate, complete or current. SDeal may make changes to the materials contained on its website at any time without notice.
          </p>
        </section>

        <section>
          <h2>6. Links</h2>
          <p>
            SDeal has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by SDeal of the site. Use of any such linked website is at the user's own risk.
          </p>
        </section>

        <section>
          <h2>7. Modifications</h2>
          <p>
            SDeal may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
          </p>
        </section>

        <section>
          <h2>8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of [Your Country] and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section>
          <h2>9. Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:legal@sdeal.com">legal@sdeal.com</a><br />
            Address: [Your Company Address]
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsAndConditions; 