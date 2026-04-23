import { FiLayers, FiLock, FiCalendar, FiFileText, FiBarChart2, FiCloud } from 'react-icons/fi';
import './Features.css';
const Features = () => {
    const features = [
        {
            icon: <FiLayers size={32}/>,
            title: 'Multi-Clinic Support',
            description: 'Manage multiple clinic locations from a single unified dashboard with centralized control.'
        },
        {
            icon: <FiLock size={32}/>,
            title: 'Role-Based Access',
            description: 'Secure access control with customizable permissions for doctors, staff, and administrators.'
        },
        {
            icon: <FiCalendar size={32}/>,
            title: 'Online & Walk-in Booking',
            description: 'Flexible appointment scheduling for both online bookings and walk-in patients.'
        },
        {
            icon: <FiFileText size={32}/>,
            title: 'Digital Assessments',
            description: 'Comprehensive digital patient assessments, forms, and medical documentation.'
        },
        {
            icon: <FiBarChart2 size={32}/>,
            title: 'Reports & Analytics',
            description: 'Real-time insights and detailed analytics to track clinic performance and growth.'
        },
        {
            icon: <FiCloud size={32}/>,
            title: 'Secure Cloud Storage',
            description: 'HIPAA-compliant cloud storage with automatic backups and 99.9% uptime guarantee.'
        }
    ];
    return (<section id="features" className="section">
            <div className="container">
                {/* Section Header */}
                <div className="section-header text-center fade-in-up">
                    <h2 className="section-title">Powerful Features</h2>
                    <p className="section-subtitle">
                        Everything you need to run a modern, efficient healthcare practice
                    </p>
                </div>

                {/* Features Grid */}
                <div className="features-grid">
                    {features.map((feature, index) => (<div key={index} className="feature-card scale-in" style={{ animationDelay: `${0.1 + index * 0.1}s` }}>
                            <div className="feature-icon-wrapper">
                                <div className="feature-icon">{feature.icon}</div>
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>))}
                </div>
            </div>
        </section>);
};
export default Features;
