import { FiCheck } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Pricing.css';
const Pricing = () => {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/public/plans');
                if (res.status === 'success') {
                    setPlans(Array.isArray(res.data) ? res.data : []);
                }
            }
            catch (err) {
                console.error('Failed to load pricing plans', err);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, []);
    const handlePlanSelect = (planId) => {
        navigate(`/register?planId=${planId}`);
    };
    return (<section id="pricing" className="section">
            <div className="container">
                {/* Section Header */}
                <div className="section-header text-center fade-in-up">
                    <h2 className="section-title">Simple, Transparent Pricing</h2>
                    <p className="section-subtitle">
                        Choose the perfect plan for your healthcare facility
                    </p>
                </div>

                {isLoading ? (<div className="text-center p-8">Loading plans...</div>) : plans.length === 0 ? (<div className="text-center p-8 text-gray-500">No active plans available at the moment.</div>) : (<div className="pricing-grid">
                        {plans.map((plan, index) => {
                const featuresList = typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : plan.features;
                return (<div key={plan.id} className={`pricing-card scale-in`} style={{ animationDelay: `${0.1 + index * 0.15}s` }}>
                                    <div className="pricing-header">
                                        <h3 className="plan-name">{plan.name}</h3>
                                        <div className="price-wrapper">
                                            <span className="price">${plan.price}</span>
                                            <span className="period">/{plan.duration}</span>
                                        </div>
                                    </div>

                                    <ul className="features-list">
                                        {featuresList.map((feature, idx) => (<li key={idx} className="feature-item">
                                                <FiCheck size={20} className="check-icon"/>
                                                <span>{feature}</span>
                                            </li>))}
                                    </ul>

                                    <button onClick={() => handlePlanSelect(plan.id)} className="btn btn-no-hover btn-large pricing-cta" style={{ width: '100%' }}>
                                        Choose Plan
                                    </button>
                                </div>);
            })}
                    </div>)}

                {/* Additional Info */}
                <div className="pricing-footer fade-in-up" style={{ animationDelay: '0.6s', marginTop: '3rem' }}>
                    <p className="pricing-note text-center">
                        Need a custom enterprise solution? <a href="mailto:contact@ev-clinic.com" style={{ color: 'var(--primary-color)' }}>Contact us</a>
                    </p>
                </div>
            </div>
        </section>);
};
export default Pricing;
