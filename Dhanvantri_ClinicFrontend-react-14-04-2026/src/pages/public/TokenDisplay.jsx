import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import './TokenDisplay.css';
const TokenDisplay = () => {
    const { subdomain } = useParams();
    const [data, setData] = useState({ queue: [], clinic: null });
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const res = await api.get(`/public/clinic/${subdomain}/live-tokens`);
                setData(res.data);
            }
            catch (err) {
                console.error('Failed to fetch tokens', err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchTokens();
        const interval = setInterval(fetchTokens, 5000); // Polling every 5 seconds for real-time updates
        return () => clearInterval(interval);
    }, [subdomain]);
    if (loading && !data.clinic) {
        return <div className="token-loading">Loading queue...</div>;
    }
    return (<div className="token-display-page" style={{ '--primary-color': data.clinic?.brandingColor || '#2D3BAE' }}>
            <div className="display-header">
                <div className="header-content">
                    {data.clinic?.logo && <img src={data.clinic.logo} alt="Logo" className="clinic-logo"/>}
                    <h1>{data.clinic?.name || 'Clinic Queue'}</h1>
                </div>
                <div className="current-time">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <div className="queue-container">
                <div className="queue-card">
                    <div className="queue-header">
                        <h2>Patient Queue Management</h2>
                    </div>

                    <div className="queue-table-wrapper">
                        <table className="queue-table">
                            <thead>
                                <tr>
                                    <th>Patient Name</th>
                                    <th>Token No</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.queue.length > 0 ? (data.queue.map((item) => (<tr key={item.id} className="queue-row">
                                            <td className="patient-name-cell">{item.patientName}</td>
                                            <td className="token-cell">
                                                <span className="token-badge">{item.tokenNumber}</span>
                                            </td>
                                            <td className="status-cell">
                                                <span className={`status-badge ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {item.status.replace(/\s+/g, '-')}
                                                </span>
                                            </td>
                                        </tr>))) : (<tr>
                                        <td colSpan={3} className="empty-queue">
                                            Currently no patients in the queue.
                                        </td>
                                    </tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="display-footer">
                <div className="scrolling-notice">
                    <div className="scrolling-content">
                        Please keep your token number ready. Your health is our priority. Visit us at {data.clinic?.location || 'our clinic'} for further assistance.
                    </div>
                </div>
            </div>
        </div>);
};
export default TokenDisplay;
