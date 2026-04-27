import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { FiUser, FiMail, FiLock, FiMapPin, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import './Login.css';
import { useAuth } from '../../context/AuthContext';
const Register = () => {
    const { login, handleRedirectByRole } = useAuth();
    const [searchParams] = useSearchParams();
    const initialPlanId = searchParams.get('planId') || '';
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        address: '',
        planId: initialPlanId,
        userType: 'ADMIN'
    });
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/public/plans');
                if (res?.success) {
                    setPlans(res.data);
                }
            }
            catch (err) {
                console.error('Failed to load plans', err);
            }
        };
        fetchPlans();
    }, []);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await api.post('/public/register', formData);
            if (res?.success) {
                if (formData.userType === 'PATIENT') {
                    // Auto-login for patients
                    const loginResult = await login(formData.email, formData.password);
                    if (loginResult.success) {
                        handleRedirectByRole('PATIENT');
                    }
                    else {
                        setError('Account created, but automatic login failed. Please login manually.');
                    }
                }
                else {
                    setSuccess(true);
                }
            }
        }
        catch (err) {
            setError(err.response?.data?.message || 'Failed to submit registration. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    if (success) {
        return (<div className="login-container">
                <div className="login-card" style={{ textAlign: 'center' }}>
                    <FiCheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }}/>
                    <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>Registration Successful!</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                        {formData.userType === 'ADMIN'
                ? 'Your registration has been submitted successfully. Please wait for Super Admin approval before you can access the dashboard.'
                : 'Your account has been created successfully. You can now login to access your patient portal.'}
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
                        Go to Login
                    </button>
                </div>
            </div>);
    }
    return (<div className="login-container">
            <div className="login-card register-card">
                <div className="login-header">
                    <h1 className="login-title">
                        {formData.userType === 'ADMIN' ? 'Register Clinic' : 'Patient Registration'}
                    </h1>
                    <h2 className="login-subtitle">
                        {formData.userType === 'ADMIN'
            ? 'Create a new clinic administration account'
            : 'Join our platform to manage your healthcare journey'}
                    </h2>
                </div>

                <form className="login-form register-form" onSubmit={handleSubmit}>
                    {error && (<div className="error-message">
                            <FiAlertCircle size={18}/>
                            <span>{error}</span>
                        </div>)}

                    <div className="form-group">
                        <label htmlFor="userType">Register As *</label>
                        <select id="userType" name="userType" value={formData.userType} onChange={handleChange} required>
                            <option value="ADMIN">Clinic Administrator (SaaS)</option>
                            <option value="PATIENT">Patient Account</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name *</label>
                            <div className="input-with-icon">
                                <FiUser className="input-icon"/>
                                <input type="text" id="firstName" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required/>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Last Name *</label>
                            <div className="input-with-icon">
                                <FiUser className="input-icon"/>
                                <input type="text" id="lastName" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required/>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <div className="input-with-icon">
                            <FiMail className="input-icon"/>
                            <input type="email" id="email" name="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required/>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Security Password *</label>
                        <div className="input-with-icon">
                            <FiLock className="input-icon"/>
                            <input type="password" id="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={6}/>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <div className="input-with-icon">
                            <FiMapPin className="input-icon"/>
                            <input type="text" id="address" name="address" placeholder="Your full address" value={formData.address} onChange={handleChange}/>
                        </div>
                    </div>

                    {formData.userType === 'ADMIN' && (<div className="form-group">
                            <label htmlFor="planId">Select Subscription Plan *</label>
                            <select id="planId" name="planId" value={formData.planId} onChange={handleChange} required>
                                <option value="">-- Choose a Plan --</option>
                                {plans.map(plan => (<option key={plan.id} value={plan.id}>
                                        {plan.name} - ${plan.price}/{plan.duration}
                                    </option>))}
                            </select>
                        </div>)}

                    <button type="submit" className={`btn btn-primary text-center btn-full ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                        {isLoading ? 'Processing...' : formData.userType === 'ADMIN' ? 'Register Clinic' : 'Create Account'}
                    </button>

                    <div className="register-footer" onClick={() => navigate('/login')}>
                        Already have an account? Login here
                    </div>
                </form>
            </div>
        </div>);
};
export default Register;
