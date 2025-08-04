import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Connections from './pages/Connections';
import Jobs from './pages/Jobs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import './App.css';

// Component to handle all language routes
const LocalizedRoute = ({ element, ...props }) => {
  return <Route {...props} element={element} />;
};

function App() {
  return (
    <HelmetProvider>
      <Router>
        <LanguageProvider>
          <div className="App">
            <Header />
            <main style={{ marginTop: '64px' }}>
              <Routes>
                {/* English routes (default) */}
                <LocalizedRoute path="/" element={<Home />} />
                <LocalizedRoute path="/connections" element={<Connections />} />
                <LocalizedRoute path="/jobs" element={<Jobs />} />
                <LocalizedRoute path="/privacy-policy" element={<PrivacyPolicy />} />
                <LocalizedRoute path="/terms-and-conditions" element={<TermsAndConditions />} />
                
                {/* Dutch routes */}
                <LocalizedRoute path="/nl" element={<Home />} />
                <LocalizedRoute path="/nl/connections" element={<Connections />} />
                <LocalizedRoute path="/nl/jobs" element={<Jobs />} />
                <LocalizedRoute path="/nl/privacy-policy" element={<PrivacyPolicy />} />
                <LocalizedRoute path="/nl/terms-and-conditions" element={<TermsAndConditions />} />
                
                {/* German routes */}
                <LocalizedRoute path="/de" element={<Home />} />
                <LocalizedRoute path="/de/connections" element={<Connections />} />
                <LocalizedRoute path="/de/jobs" element={<Jobs />} />
                <LocalizedRoute path="/de/privacy-policy" element={<PrivacyPolicy />} />
                <LocalizedRoute path="/de/terms-and-conditions" element={<TermsAndConditions />} />
                
                {/* French routes */}
                <LocalizedRoute path="/fr" element={<Home />} />
                <LocalizedRoute path="/fr/connections" element={<Connections />} />
                <LocalizedRoute path="/fr/jobs" element={<Jobs />} />
                <LocalizedRoute path="/fr/privacy-policy" element={<PrivacyPolicy />} />
                <LocalizedRoute path="/fr/terms-and-conditions" element={<TermsAndConditions />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </LanguageProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App; 