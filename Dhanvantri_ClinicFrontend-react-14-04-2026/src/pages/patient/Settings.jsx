import { useState } from 'react';
import { FiLock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './PatientBooking.css';
const PatientSettings = () => {
    const { changePassword } = useAuth();
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            if (res.success) {
                setMessage({ type: 'success', text: 'Password changed successfully.' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
            else {
                setMessage({ type: 'error', text: res.message || 'Failed to change password.' });
            }
        }
        catch (error) {
            setMessage({ type: 'error', text: error.message || 'An error occurred.' });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="settings-page fade-in">
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your account security.</p>
                </div>
            </div>

            <div className="content-card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                <div className="card-header">
                    <h2>Change Password</h2>
                </div>
                <div className="p-lg">
                    <form onSubmit={handleSubmit} className="mt-md">
                        {message.text && (<div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-md`}>
                                {message.text}
                            </div>)}

                        <div className="form-group mb-md">
                            <label>Current Password</label>
                            <div className="input-with-icon">
                                <FiLock className="input-icon"/>
                                <input type="password" placeholder="Enter current password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required/>
                            </div>
                        </div>

                        <div className="form-group mb-md">
                            <label>New Password</label>
                            <div className="input-with-icon">
                                <FiLock className="input-icon"/>
                                <input type="password" placeholder="Enter new password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} required/>
                            </div>
                        </div>

                        <div className="form-group mb-lg">
                            <label>Confirm New Password</label>
                            <div className="input-with-icon">
                                <FiLock className="input-icon"/>
                                <input type="password" placeholder="Confirm new password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required/>
                            </div>
                        </div>

                        <button type="submit" className="btn w-full" disabled={isLoading} style={{
            background: '#0f172a',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'default',
            width: '100%',
            marginTop: '1rem',
            pointerEvents: isLoading ? 'none' : 'auto',
            opacity: isLoading ? 0.7 : 1
        }} onMouseEnter={(e) => { if (!isLoading)
        e.currentTarget.style.background = '#0f172a'; }} onMouseLeave={(e) => { if (!isLoading)
        e.currentTarget.style.background = '#0f172a'; }}>
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>);
};
export default PatientSettings;
