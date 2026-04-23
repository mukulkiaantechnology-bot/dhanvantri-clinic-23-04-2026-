import { FiCheckCircle, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi';
import './About.css';
const About = () => {
    const stats = [
        {
            icon: <FiUsers size={32}/>,
            number: '500+',
            label: 'Healthcare Facilities'
        },
        {
            icon: <FiCheckCircle size={32}/>,
            number: '1M+',
            label: 'Patients Served'
        },
        {
            icon: <FiAward size={32}/>,
            number: '15+',
            label: 'Years Experience'
        },
        {
            icon: <FiTrendingUp size={32}/>,
            number: '99.9%',
            label: 'Client Satisfaction'
        }
    ];
    return (<section id="about" className="section section-light">
            <div className="container">
                {/* Section Header */}
                <div className="section-header text-center fade-in-up">
                    <h2 className="section-title">About Dhanwantri Hospital</h2>
                    <p className="section-subtitle">
                        Leading the digital transformation in healthcare management
                    </p>
                </div>

                <div className="about-content">
                    {/* About Text */}
                    <div className="about-text slide-in-left">
                        <h3 className="about-heading">Transforming Healthcare Through Technology</h3>
                        <p className="about-description">
                            Dhanwantri Hospital & Multispeciality Center is a pioneering healthcare institution dedicated to
                            providing world-class medical services and revolutionary healthcare management. Since our
                            inception, we've been committed to providing compassionate, powerful, and secure
                            healthcare that empowers our community and delivers exceptional patient care.
                        </p>
                        <p className="about-description">
                            Our comprehensive suite of digital tools streamlines everything from patient
                            management and appointment scheduling to billing and analytics. We understand
                            the unique challenges healthcare professionals face, and we've built our
                            platform to address them with precision and care.
                        </p>

                        <div className="about-features">
                            <div className="about-feature">
                                <FiCheckCircle size={20} style={{ color: 'var(--secondary-color)' }}/>
                                <span>HIPAA Compliant & Secure</span>
                            </div>
                            <div className="about-feature">
                                <FiCheckCircle size={20} style={{ color: 'var(--secondary-color)' }}/>
                                <span>24/7 Customer Support</span>
                            </div>
                            <div className="about-feature">
                                <FiCheckCircle size={20} style={{ color: 'var(--secondary-color)' }}/>
                                <span>Regular Updates & Training</span>
                            </div>
                            <div className="about-feature">
                                <FiCheckCircle size={20} style={{ color: 'var(--secondary-color)' }}/>
                                <span>Scalable Solutions</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="about-stats">
                        {stats.map((stat, index) => (<div key={index} className="stat-card scale-in" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                                <div className="stat-icon">{stat.icon}</div>
                                <h3 className="stat-number">{stat.number}</h3>
                                <p className="stat-label">{stat.label}</p>
                            </div>))}
                    </div>
                </div>
            </div>
        </section>);
};
export default About;
