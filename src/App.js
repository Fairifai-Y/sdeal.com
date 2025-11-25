import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Connections from './pages/Connections';
import Partners from './pages/Partners';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Jobs from './pages/Jobs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import TermsSellers from './pages/TermsSellers';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import Package from './pages/Package';
import LifetimeDiscountGroup from './pages/LifetimeDiscountGroup';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <LanguageProvider>
          <div className="App">
            <Routes>
              {/* Admin route - no header/footer */}
              <Route path="/admin" element={<Admin />} />
              
              {/* All other routes with header/footer */}
              <Route path="*" element={
                <>
                  <Header />
                  <main style={{ marginTop: '64px' }}>
                    <Routes>
                      {/* English routes (default) */}
                      <Route path="/" element={<Home />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:productSlug" element={<ProductDetail />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/terms-sellers" element={<TermsSellers />} />
                <Route path="/package" element={<Package />} />
                <Route path="/Lifetime-Discount-Group" element={<LifetimeDiscountGroup />} />
                
                {/* Dutch routes */}
                <Route path="/nl" element={<Home />} />
                <Route path="/nl/connections" element={<Connections />} />
                <Route path="/nl/partners" element={<Partners />} />
                <Route path="/nl/faq" element={<FAQ />} />
                <Route path="/nl/contact" element={<Contact />} />
                <Route path="/nl/jobs" element={<Jobs />} />
                <Route path="/nl/products" element={<Products />} />
                <Route path="/nl/products/:productSlug" element={<ProductDetail />} />
                <Route path="/nl/pricing" element={<Pricing />} />
                <Route path="/nl/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/nl/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/nl/terms-sellers" element={<TermsSellers />} />
                <Route path="/nl/package" element={<Package />} />
                <Route path="/nl/Lifetime-Discount-Group" element={<LifetimeDiscountGroup />} />
                
                {/* German routes */}
                <Route path="/de" element={<Home />} />
                <Route path="/de/connections" element={<Connections />} />
                <Route path="/de/partners" element={<Partners />} />
                <Route path="/de/faq" element={<FAQ />} />
                <Route path="/de/contact" element={<Contact />} />
                <Route path="/de/jobs" element={<Jobs />} />
                <Route path="/de/products" element={<Products />} />
                <Route path="/de/products/:productSlug" element={<ProductDetail />} />
                <Route path="/de/pricing" element={<Pricing />} />
                <Route path="/de/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/de/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/de/terms-sellers" element={<TermsSellers />} />
                <Route path="/de/package" element={<Package />} />
                <Route path="/de/Lifetime-Discount-Group" element={<LifetimeDiscountGroup />} />
                
                {/* French routes */}
                <Route path="/fr" element={<Home />} />
                <Route path="/fr/connections" element={<Connections />} />
                <Route path="/fr/partners" element={<Partners />} />
                <Route path="/fr/faq" element={<FAQ />} />
                <Route path="/fr/contact" element={<Contact />} />
                <Route path="/fr/jobs" element={<Jobs />} />
                <Route path="/fr/products" element={<Products />} />
                <Route path="/fr/products/:productSlug" element={<ProductDetail />} />
                <Route path="/fr/pricing" element={<Pricing />} />
                <Route path="/fr/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/fr/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/fr/terms-sellers" element={<TermsSellers />} />
                <Route path="/fr/package" element={<Package />} />
                <Route path="/fr/Lifetime-Discount-Group" element={<LifetimeDiscountGroup />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
          </div>
        </LanguageProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App; 