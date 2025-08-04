import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Connections from './pages/Connections';
import Partners from './pages/Partners';
import Jobs from './pages/Jobs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import './App.css';

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
                <Route path="/" element={<Home />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                
                {/* Dutch routes */}
                <Route path="/nl" element={<Home />} />
                <Route path="/nl/connections" element={<Connections />} />
                <Route path="/nl/partners" element={<Partners />} />
                <Route path="/nl/jobs" element={<Jobs />} />
                <Route path="/nl/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/nl/terms-and-conditions" element={<TermsAndConditions />} />
                
                {/* German routes */}
                <Route path="/de" element={<Home />} />
                <Route path="/de/connections" element={<Connections />} />
                <Route path="/de/partners" element={<Partners />} />
                <Route path="/de/jobs" element={<Jobs />} />
                <Route path="/de/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/de/terms-and-conditions" element={<TermsAndConditions />} />
                
                {/* French routes */}
                <Route path="/fr" element={<Home />} />
                <Route path="/fr/connections" element={<Connections />} />
                <Route path="/fr/partners" element={<Partners />} />
                <Route path="/fr/jobs" element={<Jobs />} />
                <Route path="/fr/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/fr/terms-and-conditions" element={<TermsAndConditions />} />
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