import { FiPhone, FiMail, FiInfo } from 'react-icons/fi';
import './HelpSupport.css';
const HelpSupport = () => {
    return (<div className="patient-help-support-page">
            <div className="patient-help-header">
                <div className="patient-help-header-left">
                    <h1 className="patient-help-title">Help & Support</h1>
                </div>
                <div className="patient-help-header-right">
                    <p className="patient-help-subtitle">Need assistance with your booking? We're here to help.</p>
                </div>
            </div>

            <div className="patient-help-content-grid">
                {/* Left Column: FAQ Section */}
                <div className="patient-help-faq-section">
                    <h3 className="patient-help-faq-title">
                        <FiInfo className="patient-help-icon"/>
                        Frequently Asked Questions
                    </h3>
                    <div className="patient-help-faq-list">
                        <div className="patient-help-faq-card">
                            <strong className="patient-help-faq-question">How long does approval take?</strong>
                            <p className="patient-help-faq-answer">Typically, appointment requests are approved within 1-2 hours during clinic working hours.</p>
                        </div>
                        <div className="patient-help-faq-card">
                            <strong className="patient-help-faq-question">Can I reschedule my appointment?</strong>
                            <p className="patient-help-faq-answer">To reschedule, please contact the clinic directly or book a new slot and cancel the previous one.</p>
                        </div>
                        <div className="patient-help-faq-card">
                            <strong className="patient-help-faq-question">What documents do I need to bring?</strong>
                            <p className="patient-help-faq-answer">Please bring a valid ID and any previous medical records relevant to your visit.</p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact & Emergency */}
                <div className="patient-help-contact-section">
                    <div className="patient-help-contact-us">
                        <h3 className="patient-help-contact-title">
                            <FiPhone className="patient-help-icon"/>
                            Contact Us
                        </h3>
                        <div className="patient-help-contact-methods">
                            <div className="patient-help-contact-item">
                                <FiPhone className="patient-help-contact-icon"/>
                                <span>Support: +91 98765 43210</span>
                            </div>
                            <div className="patient-help-contact-item">
                                <FiMail className="patient-help-contact-icon"/>
                                <span>Email: support@evclinic.com</span>
                            </div>
                        </div>
                    </div>

                    <div className="patient-help-emergency-card">
                        <h3 className="patient-help-emergency-title">Emergency?</h3>
                        <p className="patient-help-emergency-text">If this is a medical emergency, please call 102 or visit the nearest emergency room immediately.</p>
                        <button className="patient-help-emergency-btn" onClick={() => window.location.href = 'tel:102'}>
                            Call Emergency
                        </button>
                    </div>
                </div>
            </div>
        </div>);
};
export default HelpSupport;
