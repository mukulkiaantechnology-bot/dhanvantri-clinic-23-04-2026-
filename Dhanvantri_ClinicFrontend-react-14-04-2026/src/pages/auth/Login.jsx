import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiShield, FiClock } from 'react-icons/fi';
import './Login.css';
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(null);
    const [step, setStep] = useState('login');
    const [otp, setOtp] = useState('');
    const [debugOtp, setDebugOtp] = useState('');
    const [timer, setTimer] = useState(30);
    const { login, confirmOTP, lockoutUntil, handleRedirectByRole, selectClinicById } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('ev_remembered_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);
    useEffect(() => {
        let interval;
        if (step === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, timer]);
    const handleResendOTP = () => {
        setTimer(30);
        
        // Mock resend call
        console.log('OTP Resent to:', email);
    };
    useEffect(() => {
        if (lockoutUntil && lockoutUntil > Date.now()) {
            setLockoutTime(lockoutUntil);
            const interval = setInterval(() => {
                if (lockoutUntil <= Date.now()) {
                    setLockoutTime(null);
                    clearInterval(interval);
                }
                else {
                    setLockoutTime(lockoutUntil);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lockoutUntil]);
    const getRemainingLockoutTime = () => {
        if (!lockoutTime)
            return '';
        const remaining = Math.max(0, lockoutTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')} `;
    };
    const autofillCredentials = (demoEmail, demoPassword = 'admin123') => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setDebugOtp('');
        setError('');
        setStep('login');
    };
    const performLogin = async (targetEmail, targetPassword, _otp) => {
        setError('');
        setIsLoading(true);
        try {
            const result = await login(targetEmail, targetPassword);
            if (result && result.success) {
                if (rememberMe) {
                    localStorage.setItem('ev_remembered_email', targetEmail);
                }
                else {
                    localStorage.removeItem('ev_remembered_email');
                }
                if (result.otpRequired) {
                    setDebugOtp(result.debugOtp || '');
                    setStep('otp');
                    setTimer(30);
                }
                else {
                    setDebugOtp('');
                    const user = result.user;
                    const isSuperAdmin = user?.roles?.some((r) => r.toUpperCase() === 'SUPER_ADMIN');
                    const isPatient = user?.role === 'PATIENT';
                    if (!isSuperAdmin && user?.clinics && user.clinics.length > 1) {
                        navigate('/select-clinic');
                    }
                    else if (isPatient && user?.clinics?.length === 1) {
                        handleRedirectByRole('PATIENT');
                    }
                    else {
                        const primaryRole = user?.role || (user?.roles && user.roles[0]) || '';
                        handleRedirectByRole(primaryRole);
                    }
                }
            }
            else {
                setError(result?.error || 'Login failed. Please try again.');
            }
        }
        catch (err) {
            console.error('Login error:', err);
            setError('Unable to connect to service. Try again later.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const result = await confirmOTP(email, otp);
            if (result.success) {
                const user = result.user;
                const isSuperAdmin = user?.roles?.some((r) => r.toUpperCase() === 'SUPER_ADMIN');
                const isPatient = user?.role === 'PATIENT';
                if (!isSuperAdmin && user?.clinics && user.clinics.length > 1) {
                    navigate('/select-clinic');
                }
                else if (isPatient && user?.clinics?.length === 1) {
                    handleRedirectByRole('PATIENT');
                }
                else {
                    const primaryRole = user?.role || (user?.roles && user.roles[0]) || '';
                    handleRedirectByRole(primaryRole);
                }
            }
            else {
                setError(result.error || 'Invalid or expired verification code');
            }
        }
        catch (err) {
            setError('Verification failed. Try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setTimer(30);
        setDebugOtp('');
        performLogin(email, password);
    };
    const isLocked = !!(lockoutTime && lockoutTime > Date.now());
    return (<div className="login-container">
            <div className="login-layout-wrapper">
                <div className="login-card">
                    <div className="login-header">
                        <div className="brand-icon-wrapper mb-md">
                            <img src={logo} alt="Dhanwantri Hospital Logo" className="brand-icon-img-login"/>
                        </div>
                        <h1 className="login-title">DHANWANTRI HOSPITAL & MULTISPECIALITY CENTER</h1>
                        <h2 className="login-subtitle">Barmer, Rajasthan</h2>
                    </div>

                    {step === 'login' ? (<form className="login-form" onSubmit={handleSubmit}>
                            {error && (<div className="error-message">
                                    <FiAlertCircle size={18}/>
                                    <span>{error}</span>
                                </div>)}

                            {isLocked && (<div className="lockout-message">
                                    <FiClock size={18}/>
                                    <div>
                                        <strong>Account Locked</strong>
                                        <p>Too many failed attempts. Try again in {getRemainingLockoutTime()}</p>
                                    </div>
                                </div>)}

                            <div className="form-group">
                                <label htmlFor="email">Work Email *</label>
                                <div className="input-with-icon">
                                    <FiMail className="input-icon"/>
                                    <input type="email" id="email" placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLocked} required/>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Security Password *</label>
                                <div className="input-with-icon">
                                    <FiLock className="input-icon"/>
                                    <input type={showPassword ? "text" : "password"} id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLocked} required minLength={6}/>
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="remember-me">
                                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={isLocked}/>
                                    <span>Remember credentials</span>
                                </label>
                            </div>

                            <button type="submit" className={`btn btn-no-hover btn-full ${isLoading ? 'loading' : ''}`} disabled={isLoading || isLocked}>
                                {isLoading ? 'Verifying Credentials...' : 'Access Dashboard'}
                            </button>

                            <div style={{ marginTop: '15px', fontSize: '11px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                <span style={{ cursor: 'pointer', background: '#e0e7ff', color: '#3730a3', outline: '1px solid #c7d2fe', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }} onClick={() => autofillCredentials('superadmin@gmail.com')}>superadmin</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('admin@gmail.com')}>clinic admin</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('doctor@gmail.com')}>doctor</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('reception@gmail.com')}>receptionist</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('pharma@gmail.com')}>pharmacy</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('lab@gmail.com')}>lab tech</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('radio@gmail.com')}>radiology</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('accountant@gmail.com')}>accountant</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('docs@gmail.com')}>document controller</span>
                                <span style={{ cursor: 'pointer', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }} onClick={() => autofillCredentials('aisha@example.com')}>patient</span>
                            </div>
                        </form>) : step === 'otp' ? (<form className="login-form" onSubmit={handleVerifyOTP}>
                            <div className="otp-explanation mb-sm">
                                <div className="shield-icon-wrap">
                                    <FiShield />
                                </div>
                                <div className="otp-badge" onClick={() => setStep('setup-2fa')} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fef3c7', color: '#92400e', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Enable App 2FA</div>
                                <h3>Two-Step Verification</h3>
                                <p>We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to secure your session.</p>
                            </div>

                            {error && (<div className="error-message">
                                    <FiAlertCircle size={18}/>
                                    <span>{error}</span>
                                </div>)}

                            <div className="form-group">
                                <label htmlFor="otp">Verification Code</label>
                                <div className="input-with-icon">
                                    <input type="text" id="otp" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus className="otp-input-field"/>
                                </div>
                            </div>
                            {debugOtp && (<div style={{ textAlign: 'center', marginTop: '-0.25rem', marginBottom: '0.5rem', fontSize: '13px', color: '#334155', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '0.55rem 0.75rem' }}>
                                    Demo OTP: <strong style={{ letterSpacing: '2px', color: '#1e293b' }}>{debugOtp}</strong>
                                </div>)}

                            <div className="otp-timer-wrap" style={{ textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                                {timer > 0 ? (<span>Resend code in <strong>{timer}s</strong></span>) : (<button type="button" className="btn-link" onClick={handleResendOTP} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}>Resend OTP now</button>)}
                            </div>

                            <button type="submit" className={`btn btn-no-hover btn-full ${isLoading ? 'loading' : ''}`} disabled={isLoading || otp.length < 6}>
                                {isLoading ? 'Verifying OTP...' : 'Confirm & Login'}
                            </button>

                            <button type="button" className="btn-link mt-sm" onClick={() => {
                    setDebugOtp('');
                    setStep('login');
                }} style={{ display: 'block', margin: '0.5rem auto', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                                Back to Login
                            </button>
                        </form>) : (<div className="login-form">
                            <div className="otp-explanation mb-lg">
                                <div className="shield-icon-wrap" style={{ background: '#dcfce7', color: '#15803d' }}>
                                    <FiShield />
                                </div>
                                <h3>Setup Google Authenticator</h3>
                                <p>Scan the QR code below using your authenticator app to enable hardware-level security.</p>
                            </div>

                            <div className="qr-container" style={{ textAlign: 'center', background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '2px dashed #e2e8f0' }}>
                                <div style={{ width: '150px', height: '150px', background: '#fff', margin: '0 auto', display: 'flex', alignItems: 'center', justifyItems: 'center', border: '1px solid #eee' }}>
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/DhanvantriHospital:rehan@ev.com?secret=JBSWY3DPEHPK3PXP&issuer=DhanvantriHospital" alt="QR Code" style={{ width: '100%' }}/>
                                </div>
                                <div className="mt-md" style={{ fontSize: '12px', color: '#64748b' }}>
                                    Manual Key: <strong style={{ letterSpacing: '2px', color: '#1e293b' }}>JBSW Y3DP EHPK 3PXP</strong>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Verify Setup Code</label>
                                <div className="input-with-icon">
                                    <input type="text" placeholder="Enter the 6-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="otp-input-field"/>
                                </div>
                            </div>

                            <button type="button" className="btn btn-no-hover btn-full" onClick={() => { setStep('otp'); setOtp(''); }} disabled={otp.length < 6}>
                                Verify & Activate 2FA
                            </button>

                            <button type="button" className="btn-link mt-md" onClick={() => setStep('otp')} style={{ display: 'block', margin: '1rem auto', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                                Cancel Setup
                            </button>
                        </div>)}
                </div>
            </div>
        </div>);
};
export default Login;
