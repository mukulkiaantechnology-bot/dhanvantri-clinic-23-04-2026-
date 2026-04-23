import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiLinkedin, FiInstagram } from 'react-icons/fi';
import './Footer.css';
const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (<footer className="footer">
        <div className="container">
            <div className="footer-content">
                {/* Company Info */}
                <div className="footer-section">
                    <div className="footer-logo">
                        <img src="/assets/logo.png" alt="Dhanwantri Hospital Logo" className="footer-logo-img" />
                    </div>
                    <p className="footer-description">
                        Smart digital healthcare solutions built for clinics and hospitals.
                    </p>
                    <div className="footer-contact">
                        <div className="contact-item">
                            <FiMail size={16} />
                            <span>info@dhanwantrihospital.com</span>
                        </div>
                        <div className="contact-item">
                            <FiPhone size={16} />
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div className="contact-item">
                            <FiMapPin size={16} />
                            <span>Barmer, Rajasthan</span>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="footer-section">
                    <h4 className="footer-heading">Company</h4>
                    <ul className="footer-links">
                        <li><a href="#about">About Us</a></li>
                        <li><a href="#services">Our Services</a></li>
                        <li><a href="#features">Features</a></li>
                        <li><a href="#pricing">Pricing</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>

                {/* Resources */}
                <div className="footer-section">
                    <h4 className="footer-heading">Resources</h4>
                    <ul className="footer-links">
                        <li><a href="#documentation">Documentation</a></li>
                        <li><a href="#support">Support Center</a></li>
                        <li><a href="#blog">Blog</a></li>
                        <li><a href="#faq">FAQ</a></li>
                        <li><a href="#tutorials">Tutorials</a></li>
                    </ul>
                </div>

                {/* Legal */}
                <div className="footer-section">
                    <h4 className="footer-heading">Legal</h4>
                    <ul className="footer-links">
                        <li><a href="#privacy">Privacy Policy</a></li>
                        <li><a href="#terms">Terms of Service</a></li>
                        <li><a href="#security">Security</a></li>
                        <li><a href="#compliance">HIPAA Compliance</a></li>
                    </ul>
                </div>
            </div>

            {/* Footer Bottom */}
            <div className="footer-bottom">
                <p className="copyright">
                    © {currentYear} Dhanwantri Hospital & Multispeciality Center. All rights reserved.
                </p>
                <div className="footer-social">
                    <span className="social-label">Follow us:</span>
                    <div className="social-icons">
                        <a href="#facebook" className="social-icon" aria-label="Facebook">
                            <FiFacebook />
                        </a>
                        <a href="#twitter" className="social-icon" aria-label="Twitter">
                            <FiTwitter />
                        </a>
                        <a href="#linkedin" className="social-icon" aria-label="LinkedIn">
                            <FiLinkedin />
                        </a>
                        <a href="#instagram" className="social-icon" aria-label="Instagram">
                            <FiInstagram />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </footer>);
};
export default Footer;
