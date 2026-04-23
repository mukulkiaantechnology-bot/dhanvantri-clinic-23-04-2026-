import { useState, useEffect } from 'react';
import { FiPieChart, FiFileText, FiClock, FiRefreshCw } from 'react-icons/fi';
import { documentService } from '../../services/document.service';
import '../SharedDashboard.css';
const DocumentReports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fetchStats = async () => {
        try {
            setRefreshing(true);
            const res = await documentService.getStats();
            setStats(res?.data ?? res ?? null);
        }
        catch (error) {
            console.error('Failed to fetch stats:', error);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useEffect(() => {
        fetchStats();
    }, []);
    const total = stats?.total ?? 0;
    const pending = stats?.pending ?? 0;
    const completed = stats?.completed ?? 0;
    return (<div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Reports</h1>
                    <p>Document controller summary and statistics.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchStats} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''}/>
                    <span>Refresh</span>
                </button>
            </div>
            <div className="stats-grid mt-lg">
                <div className="stat-card">
                    <div className="stat-icon purple"><FiFileText /></div>
                    <div className="stat-info">
                        <h3>{loading ? '—' : total}</h3>
                        <p>Total Documents</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{loading ? '—' : pending}</h3>
                        <p>Pending Processing</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><FiPieChart /></div>
                    <div className="stat-info">
                        <h3>{loading ? '—' : completed}</h3>
                        <p>Completed</p>
                    </div>
                </div>
            </div>
            <div className="content-card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h2><FiPieChart /> Summary</h2>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {loading ? (<p className="text-center">Loading...</p>) : (<p>Total clinical records: <strong>{total}</strong>. Pending: <strong>{pending}</strong>, Completed: <strong>{completed}</strong>.</p>)}
                </div>
            </div>
        </div>);
};
export default DocumentReports;
