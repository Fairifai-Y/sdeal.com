import React, { useState } from 'react';
import './Jobs.css';

const Jobs = () => {
  const [selectedJob, setSelectedJob] = useState(null);

  const jobs = [
    {
      id: 'senior-developer',
      title: 'Senior Developer',
      category: 'Full-time',
      location: 'Groningen, Netherlands',
      type: 'Remote/Hybrid',
      salary: '€3,500 - €5,500',
      description: 'We are looking for a Senior Developer to maintain and implement our platform using Magento. You will add functionalities and modules and implement integrations with business processes.',
      responsibilities: [
        'Object-oriented development in PHP',
        'Modular maintenance and implementation of new innovations',
        'Developing and testing web applications',
        'Adding functionalities and modules and integrating with business processes',
        'Senior development responsibilities',
        'Contributing to the company\'s technical vision and optimizing all ICT-related activities',
        'Providing input on technical developments in the market',
        'Providing technical guidance and direction to our developers abroad'
      ],
      requirements: [
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
      benefits: [
        'A role with full freedom and responsibility',
        'Being part of a fast-growing startup with international ambitions',
        'Flexible remote working',
        'On-the-job training to help you grow',
        'Base salary depending on education and experience',
        'Opportunity to acquire a stake in the company'
      ]
    },
    {
      id: 'office-manager',
      title: 'Office Manager',
      category: 'Full-time',
      location: 'Groningen, Netherlands',
      type: 'On-site',
      salary: '€2,500 - €3,500',
      description: 'We are looking for an organized and proactive Office Manager to ensure smooth daily operations and support our growing team.',
      responsibilities: [
        'Manage office operations and administrative tasks',
        'Coordinate meetings and events',
        'Handle correspondence and communications',
        'Support HR and recruitment processes',
        'Manage office supplies and equipment',
        'Coordinate with external vendors and service providers'
      ],
      requirements: [
        'Bachelor\'s degree in Business Administration or related field',
        '2+ years of office management experience',
        'Excellent organizational and multitasking skills',
        'Strong communication and interpersonal abilities',
        'Proficiency in Microsoft Office Suite',
        'Attention to detail and problem-solving skills'
      ],
      benefits: [
        'Competitive salary package',
        'Professional development opportunities',
        'Collaborative work environment',
        'Health and wellness benefits',
        'Modern office facilities'
      ]
    },
    {
      id: 'traineeship-sales',
      title: 'Traineeship Sales',
      category: 'Traineeship',
      location: 'Groningen, Netherlands',
      type: 'Hybrid',
      salary: '€1,800 - €2,200',
      description: 'Join our sales team and learn the ins and outs of B2B sales in the e-commerce industry. Perfect for recent graduates looking to start their career.',
      responsibilities: [
        'Learn and understand our product portfolio',
        'Support senior sales representatives',
        'Participate in sales training and workshops',
        'Assist with lead generation and qualification',
        'Learn CRM systems and sales processes',
        'Contribute to sales strategy development'
      ],
      requirements: [
        'Bachelor\'s degree in Business, Marketing, or related field',
        'Strong interest in sales and business development',
        'Excellent communication and presentation skills',
        'Self-motivated and eager to learn',
        'Team player with positive attitude',
        'Fluent in Dutch and English'
      ],
      benefits: [
        'Comprehensive sales training program',
        'Mentorship from experienced sales professionals',
        'Potential for permanent position after traineeship',
        'Competitive traineeship allowance',
        'Real-world experience in fast-growing company'
      ]
    },
    {
      id: 'traineeship-finance',
      title: 'Traineeship Finance',
      category: 'Traineeship',
      location: 'Groningen, Netherlands',
      type: 'Hybrid',
      salary: '€1,800 - €2,200',
      description: 'Gain hands-on experience in financial operations and learn about e-commerce finance in a dynamic startup environment.',
      responsibilities: [
        'Assist with financial reporting and analysis',
        'Learn about e-commerce payment processing',
        'Support accounts payable and receivable processes',
        'Participate in budgeting and forecasting activities',
        'Learn about financial compliance and regulations',
        'Assist with financial data entry and reconciliation'
      ],
      requirements: [
        'Bachelor\'s degree in Finance, Accounting, or related field',
        'Strong analytical and numerical skills',
        'Attention to detail and accuracy',
        'Proficiency in Excel and financial software',
        'Interest in e-commerce and fintech',
        'Fluent in Dutch and English'
      ],
      benefits: [
        'Comprehensive finance training program',
        'Exposure to e-commerce financial operations',
        'Mentorship from experienced finance professionals',
        'Potential for permanent position after traineeship',
        'Competitive traineeship allowance'
      ]
    },
    {
      id: 'traineeship-data-content',
      title: 'Traineeship Data Content',
      category: 'Traineeship',
      location: 'Groningen, Netherlands',
      type: 'Hybrid',
      salary: '€1,800 - €2,200',
      description: 'Learn about data management and content optimization in the e-commerce industry. Perfect for data enthusiasts and content creators.',
      responsibilities: [
        'Assist with product data management and optimization',
        'Learn about content creation and SEO',
        'Support data analysis and reporting',
        'Participate in content strategy development',
        'Learn about e-commerce platforms and tools',
        'Assist with product catalog management'
      ],
      requirements: [
        'Bachelor\'s degree in Data Science, Marketing, or related field',
        'Strong analytical and creative skills',
        'Interest in e-commerce and digital marketing',
        'Proficiency in Excel and data analysis tools',
        'Good writing and communication skills',
        'Fluent in Dutch and English'
      ],
      benefits: [
        'Comprehensive data and content training program',
        'Exposure to e-commerce data operations',
        'Mentorship from experienced professionals',
        'Potential for permanent position after traineeship',
        'Competitive traineeship allowance'
      ]
    }
  ];

  const openJobDetails = (job) => {
    setSelectedJob(job);
  };

  const closeJobDetails = () => {
    setSelectedJob(null);
  };

  return (
    <div className="jobs-container">
      <div className="w3-content w3-padding-64">
        <h1 className="w3-center">Join Our Team</h1>
        
        <div className="jobs-intro">
          <p className="w3-center w3-large">
            We are currently looking for top talents to join our fast-growing team. 
            Discover opportunities that match your skills and ambitions.
          </p>
        </div>

        <div className="jobs-categories">
          <div className="category-section">
            <h2>Full-time Positions</h2>
            <div className="jobs-grid">
              {jobs.filter(job => job.category === 'Full-time').map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3 className="job-title">{job.title}</h3>
                    <span className="job-category">{job.category}</span>
                  </div>
                  <div className="job-details">
                    <div className="job-info">
                      <span><i className="fa fa-map-marker"></i> {job.location}</span>
                      <span><i className="fa fa-clock-o"></i> {job.type}</span>
                      <span><i className="fa fa-euro"></i> {job.salary}</span>
                    </div>
                    <p className="job-description">{job.description}</p>
                    <button 
                      className="apply-button"
                      onClick={() => openJobDetails(job)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="category-section">
            <h2>Traineeships</h2>
            <p className="traineeship-intro">
              We are regularly seeking young and motivated talent who are eager to further develop their skills in their field.
            </p>
            <div className="jobs-grid">
              {jobs.filter(job => job.category === 'Traineeship').map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <h3 className="job-title">{job.title}</h3>
                    <span className="job-category">{job.category}</span>
                  </div>
                  <div className="job-details">
                    <div className="job-info">
                      <span><i className="fa fa-map-marker"></i> {job.location}</span>
                      <span><i className="fa fa-clock-o"></i> {job.type}</span>
                      <span><i className="fa fa-euro"></i> {job.salary}</span>
                    </div>
                    <p className="job-description">{job.description}</p>
                    <button 
                      className="apply-button"
                      onClick={() => openJobDetails(job)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="contact-section">
          <div className="w3-center w3-padding-32">
            <h3>Interested in Joining Our Team?</h3>
            <p>
              Does one of the positions above suit you perfectly? Don't hesitate and{' '}
              <a href="mailto:jobs@sdeal.com">contact us</a> at{' '}
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
              <h2>{selectedJob.title}</h2>
              <div className="modal-job-info">
                <span><i className="fa fa-map-marker"></i> {selectedJob.location}</span>
                <span><i className="fa fa-clock-o"></i> {selectedJob.type}</span>
                <span><i className="fa fa-euro"></i> {selectedJob.salary}</span>
              </div>
            </div>

            <div className="modal-content">
              <p className="modal-description">{selectedJob.description}</p>

              <div className="modal-section">
                <h3>Key Responsibilities</h3>
                <ul>
                  {selectedJob.responsibilities.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="modal-section">
                <h3>Requirements</h3>
                <ul>
                  {selectedJob.requirements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="modal-section">
                <h3>What We Offer</h3>
                <ul>
                  {selectedJob.benefits.map((item, index) => (
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
                Apply Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs; 