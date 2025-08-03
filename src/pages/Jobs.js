import React, { useState } from 'react';
import './Jobs.css';

const Jobs = () => {
  const [activeSection, setActiveSection] = useState('');

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w3-content w3-padding" style={{ maxWidth: '1564px' }}>
      <div className="row" style={{ paddingBottom: '15px' }}>
        <h2>JOBS</h2>
        <h2 className="title-with-line-next"></h2>
      </div>

      <p>We are currently looking for top talents for the following positions:</p>

      <div className="list-group">
        <a 
          className="list-group-item list-group-item-action" 
          href="#senior-developer"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('senior-developer');
          }}
        >
          Senior Developer
        </a><br />
        <a 
          className="list-group-item list-group-item-action" 
          href="#office-manager"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('office-manager');
          }}
        >
          Office manager
        </a><br />
      </div>

      <h2>Traineeships</h2>
      <h2 className="title-with-line-next"></h2>

      <p>We are regularly seeking young and motivated talent who are eager to further develop their skills in their field.</p>

      <div className="list-group">
        <a 
          className="list-group-item list-group-item-action" 
          href="#traineeship-sales"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('traineeship-sales');
          }}
        >
          Traineeship Sales
        </a><br />
        <a 
          className="list-group-item list-group-item-action" 
          href="#traineeship-finance"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('traineeship-finance');
          }}
        >
          Traineeship Finance
        </a><br />
        <a 
          className="list-group-item list-group-item-action" 
          href="#traineeship-data-content"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('traineeship-data-content');
          }}
        >
          Traineeship Data Content
        </a><br />
      </div>

      <p>
        <strong>
          Does one of the positions above suit you perfectly? Don't hesitate and{' '}
          <a href="mailto:jobs@sdeal.com">contact us</a> at{' '}
          <a href="mailto:jobs@sdeal.com">jobs@sdeal.com</a>.
        </strong>
      </p>

      <hr style={{ border: '1px solid #ccc', margin: '40px 0' }} />

      <div className="w3-content w3-padding" style={{ maxWidth: '1564px', marginTop: '20px' }}>
        <div id="senior-developer">
          <h2><b>Senior Developer</b></h2>
          <p>
            We are currently looking for a <strong>Senior Developer</strong>. In this role, you will be responsible for the maintenance and implementation of our platform using the open-source framework Magento. You will add functionalities and modules and implement integrations with business processes. You have a clean and careful programming style, and you work independently and accurately. Work experience and knowledge of PHP development and relational databases is required. Affinity with E-commerce is a plus. You are able to independently develop and test web applications. You will also further develop existing modules and contribute ideas for new applications. You will communicate with and provide technical guidance to external developers.
          </p>

          <p>
            Are you the specialist who can take our company to the next level? Do you show initiative, work solution-oriented, and are you looking for a unique challenge? Apply now!
          </p>

          <h3>THE ROLE</h3>
          <p>We are looking for a Senior Developer. Key responsibilities include:</p>
          <ul>
            <li>Object-oriented development in PHP</li>
            <li>Modular maintenance and implementation of new innovations</li>
            <li>Developing and testing web applications</li>
            <li>Adding functionalities and modules and integrating with business processes</li>
            <li>Senior development responsibilities</li>
            <li>Contributing to the company's technical vision and optimizing all ICT-related activities</li>
            <li>Providing input on technical developments in the market</li>
            <li>Providing technical guidance and direction to our developers abroad</li>
          </ul>

          <h3>WHAT WE'RE LOOKING FOR</h3>
          <ul>
            <li>Bachelor's or Master's degree (ICT-related)</li>
            <li>Relevant work experience (from previous jobs and/or internships)</li>
            <li>Proven experience with object-oriented PHP development</li>
            <li>Extensive knowledge of Magento is a plus</li>
            <li>Experience with version control systems</li>
            <li>Affinity with E-commerce is a plus</li>
            <li>Accuracy</li>
            <li>Problem-solving skills</li>
            <li>Strong analytical abilities</li>
            <li>Excellent communication skills</li>
            <li>Strong work ethic</li>
          </ul>

          <h3>WHAT WE OFFER</h3>
          <ul>
            <li>A role with full freedom and responsibility</li>
            <li>Being part of a fast-growing startup with international ambitions</li>
            <li>Flexible remote working</li>
            <li>On-the-job training to help you grow</li>
            <li>A base salary depending on education and experience, between €3,500 and €5,500</li>
            <li>Opportunity to acquire a stake in the company</li>
          </ul>
        </div>

        <hr style={{ border: '1px solid #ccc', margin: '40px 0' }} />

        {/* Add more job sections here as needed */}
        <div id="office-manager">
          <h2><b>Office Manager</b></h2>
          <p>Details for Office Manager position will be added here...</p>
        </div>

        <hr style={{ border: '1px solid #ccc', margin: '40px 0' }} />

        <div id="traineeship-sales">
          <h2><b>Traineeship Sales</b></h2>
          <p>Details for Sales Traineeship will be added here...</p>
        </div>

        <hr style={{ border: '1px solid #ccc', margin: '40px 0' }} />

        <div id="traineeship-finance">
          <h2><b>Traineeship Finance</b></h2>
          <p>Details for Finance Traineeship will be added here...</p>
        </div>

        <hr style={{ border: '1px solid #ccc', margin: '40px 0' }} />

        <div id="traineeship-data-content">
          <h2><b>Traineeship Data Content</b></h2>
          <p>Details for Data Content Traineeship will be added here...</p>
        </div>
      </div>
    </div>
  );
};

export default Jobs; 