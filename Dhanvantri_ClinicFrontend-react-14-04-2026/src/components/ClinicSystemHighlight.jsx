import { FiUsers, FiCalendar, FiDollarSign, FiUserCheck, FiShield, FiExternalLink } from 'react-icons/fi';
import clinicIllustration from '../assets/clinic-illustration.png';
import './ClinicSystemHighlight.css';
const ClinicSystemHighlight = () => {
    const highlights = [
        {
            icon: <FiUsers size={24} />,
            title: 'Patient Management',
            description: 'Complete digital patient records and history tracking'
        },
        {
            icon: <FiCalendar size={24} />,
            title: 'Appointment Booking',
            description: 'Online and walk-in appointment scheduling system'
        },
        {
            icon: <FiDollarSign size={24} />,
            title: 'Billing & Invoicing',
            description: 'Automated billing, invoicing, and payment tracking'
        },
        {
            icon: <FiUserCheck size={24} />,
            title: 'Doctor & Staff Management',
            description: 'Manage your team with role-based access control'
        },
        {
            icon: <FiShield size={24} />,
            title: 'Secure Patient Records',
            description: 'HIPAA-compliant data security and encryption'
        }
    ];
    const handleExploreClick = () => {
        window.open('https://clinic.exclusivevision.online/', '_blank');
    };
    return (<section id="clinic-system" className="clinic-highlight section section-gradient">
        <div className="container">
            {/* Section Header - Now centered and stacked */}
            {/* Section Header - Now centered and stacked */}
            <div className="section-header text-center">
                <h2 className="section-title" style={{ color: '#134876ff', marginBottom: '1rem' }}>
                    DHANWANTRI HOSPITAL & MULTISPECIALITY CENTER
                </h2>
                <p className="section-subtitle" style={{ color: 'rgba(29, 40, 150, 0.9)' }}>
                    A dedicated software solution designed specifically for clinics to manage daily operations digitally.
                </p>
            </div>

            <div className="clinic-content">
                {/* Left Side - Visual Illustration */}
                <div className="clinic-visual slide-in-left">
                    <div className="visual-wrapper float-animation">
                        <img src={clinicIllustration} alt="Dhanwantri Hospital System Illustration" />
                        <div className="visual-glow"></div>
                    </div>
                </div>

                {/* Right Side - Key Highlights */}
                <div className="clinic-text slide-in-right">
                    <div className="highlights-grid">
                        {highlights.map((highlight, index) => (<div key={index} className="highlight-item fade-in-up" style={{ animationDelay: `${0.1 + index * 0.1}s` }}>
                            <div className="highlight-icon">{highlight.icon}</div>
                            <div className="highlight-content">
                                <h4 className="highlight-title">{highlight.title}</h4>
                                <p className="highlight-description">{highlight.description}</p>
                            </div>
                        </div>))}
                    </div>

                    {/* CTA Button */}
                    <div className="clinic-actions">
                        <button className="btn btn-large clinic-cta glow-animation" onClick={handleExploreClick}>
                            Explore Dhanwantri Hospital System
                            <FiExternalLink style={{ marginLeft: '0.5rem' }} size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>);
};
export default ClinicSystemHighlight;
