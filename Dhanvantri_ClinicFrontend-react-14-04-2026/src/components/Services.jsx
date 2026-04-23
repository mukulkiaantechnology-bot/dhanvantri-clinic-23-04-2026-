import { FiActivity, FiHeart, FiArrowRight, FiShield } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import './Services.css';
const Services = () => {
    const services = [
        {
            icon: <FiActivity size={40} />,
            title: 'DH Clinic System',
            description: 'Comprehensive digital solution designed specifically for clinics to streamline patient management, appointments, and daily operations.',
            features: ['Patient Records', 'Appointment Scheduling', 'Billing & Invoicing']
        },
        {
            icon: <MdLocalHospital size={40} />,
            title: 'DH Hospital System',
            description: 'Enterprise-grade hospital management platform for large healthcare facilities with advanced features and multi-department support.',
            features: ['Multi-Department', 'Advanced Analytics', 'Inventory Management']
        },
        {
            icon: <FiShield size={40} />,
            title: 'Platform Administrators',
            description: 'Centralized administration portal for managing multiple healthcare facilities, overseeing audits, and system-wide configurations.',
            features: ['Facility Oversight', 'Centralized Audits', 'Role Management']
        }
    ];
    return (<section id="services" className="section section-light">
        <div className="container">
            {/* Section Header */}
            <div className="section-header text-center fade-in-up">
                <h2 className="section-title">Our Solutions</h2>
                <p className="section-subtitle">
                    Tailored healthcare management systems for every need
                </p>
            </div>

            {/* Services Grid */}
            <div className="services-grid">
                {services.map((service, index) => (<div key={index} className="service-card card scale-in" style={{ animationDelay: `${0.2 + index * 0.15}s` }}>
                    <div className="service-icon" style={{ color: 'var(--primary-color)' }}>
                        {service.icon}
                    </div>
                    <h3 className="service-title">{service.title}</h3>
                    <p className="service-description">{service.description}</p>

                    <ul className="service-features">
                        {service.features.map((feature, idx) => (<li key={idx}>
                            <FiHeart size={16} style={{ color: 'var(--secondary-color)' }} />
                            <span>{feature}</span>
                        </li>))}
                    </ul>

                    <button className="service-link">
                        Learn More
                        <FiArrowRight size={18} />
                    </button>
                </div>))}
            </div>
        </div>
    </section>);
};
export default Services;
