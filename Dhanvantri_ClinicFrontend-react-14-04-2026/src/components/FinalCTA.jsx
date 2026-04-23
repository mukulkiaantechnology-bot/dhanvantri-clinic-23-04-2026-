import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import './FinalCTA.css';
const FinalCTA = () => {
    const navigate = useNavigate();
    return (<section className="final-cta section-gradient">
            <div className="container">
                <div className="cta-content">
                    <h2 className="cta-title fade-in-up">Ready to transform your clinic digitally?</h2>
                    <p className="cta-subtitle fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Join hundreds of clinics and hospitals already using Dhanwantri Hospital
                        to deliver better patient care and streamline operations.
                    </p>
                    <button className="btn btn-large cta-button scale-in glow-animation" style={{ animationDelay: '0.2s' }} onClick={() => navigate('/login')}>
                        Try It Now
                        <FiArrowRight style={{ marginLeft: '0.5rem' }} size={20}/>
                    </button>

                    <div className="cta-features fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <div className="cta-feature">
                            <FiCheckCircle className="check-icon"/>
                            <span>Free 30-day trial</span>
                        </div>
                        <div className="cta-feature">
                            <FiCheckCircle className="check-icon"/>
                            <span>No credit card required</span>
                        </div>
                        <div className="cta-feature">
                            <FiCheckCircle className="check-icon"/>
                            <span>24/7 support included</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>);
};
export default FinalCTA;
