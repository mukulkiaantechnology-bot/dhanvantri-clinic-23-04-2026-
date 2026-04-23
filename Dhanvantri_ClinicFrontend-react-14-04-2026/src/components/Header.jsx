import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import './Header.css';
const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMobileMenuOpen(false);
        }
    };
    const handleLoginClick = () => {
        navigate('/login');
        setIsMobileMenuOpen(false);
    };
    return (<header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <div className="logo">
            <img src="/assets/logo.png" alt="Dhanwantri Hospital Logo" className="logo-img"/>
          </div>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <button onClick={() => scrollToSection('home')} className="nav-link">
              Home
            </button>
            <button onClick={() => scrollToSection('about')} className="nav-link">
              About Us
            </button>
            <button onClick={() => scrollToSection('services')} className="nav-link">
              Services
            </button>
            <button onClick={() => scrollToSection('features')} className="nav-link">
              Features
            </button>
            <button onClick={() => scrollToSection('pricing')} className="nav-link">
              Pricing
            </button>
          </nav>

          {/* Auth Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary login-btn" onClick={handleLoginClick}>Login</button>
            <button className="btn btn-primary login-btn" style={{ background: 'var(--primary-color)' }} onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>Register</button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
            {isMobileMenuOpen ? <FiX size={24}/> : <FiMenu size={24}/>}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (<nav className="nav-mobile">
            <button onClick={() => scrollToSection('home')} className="nav-link-mobile">
              Home
            </button>
            <button onClick={() => scrollToSection('about')} className="nav-link-mobile">
              About Us
            </button>
            <button onClick={() => scrollToSection('services')} className="nav-link-mobile">
              Services
            </button>
            <button onClick={() => scrollToSection('features')} className="nav-link-mobile">
              Features
            </button>
            <button onClick={() => scrollToSection('pricing')} className="nav-link-mobile">
              Pricing
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', width: '100%' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleLoginClick}>
                Login
              </button>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--primary-color)' }} onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>
                Register
              </button>
            </div>
          </nav>)}
      </div>
    </header>);
};
export default Header;
