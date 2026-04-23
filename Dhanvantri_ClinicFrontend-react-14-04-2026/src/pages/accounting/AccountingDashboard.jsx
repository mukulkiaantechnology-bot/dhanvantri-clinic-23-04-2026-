import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiFileText, FiTrendingUp, FiCreditCard, FiArrowRight, FiActivity } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { billingService } from '../../services/billing.service';
import { useCurrency } from '../../context/CurrencyContext';
import './AccountingDashboard.css';
const AccountingDashboard = () => {
    const { selectedClinic } = useAuth();
    const { refreshTrigger } = useApp();
    const navigate = useNavigate();
    const { formatMoney } = useCurrency();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchStats = async () => {
        if (!selectedClinic?.id)
            return;
        setLoading(true);
        try {
            const res = await billingService.getAccountingDashboardStats();
            const data = res?.data ?? res;
            setStats({
                todayIncome: data.incomeToday ?? 0,
                pendingPayments: data.unpaidTotal ?? 0,
                totalRevenue: data.totalRevenue ?? 0,
                pendingInvoicesCount: data.pendingInvoices ?? 0,
                invoices: Array.isArray(data.invoices) ? data.invoices : []
            });
        }
        catch {
            setStats({
                todayIncome: 0,
                pendingPayments: 0,
                totalRevenue: 0,
                pendingInvoicesCount: 0,
                invoices: []
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchStats();
    }, [selectedClinic?.id, refreshTrigger]);
    const recentInvoices = (stats?.invoices ?? []).slice(0, 10);
    return (<div className="accounting-dashboard fade-in">
            <div className="accounting-header">
                <div>
                    <h1>Accounting Overview</h1>
                    <p>Comprehensive financial summaries and transaction monitoring for {selectedClinic?.name || 'Clinic'}.</p>
                </div>
            </div>

            {loading && !stats ? (<div className="p-xl text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <FiActivity size={48} className="text-primary mb-md"/>
                        <p>Loading accounting data...</p>
                    </div>
                </div>) : (<>
                    <div className="finance-stats-grid">
                        <div className="finance-card income" onClick={() => navigate('/accounting/billing')} style={{ cursor: 'pointer' }}>
                            <div className="card-icon">
                                <FiDollarSign />
                            </div>
                            <div className="card-meta">
                                <p>Today's Income</p>
                                <h3>{formatMoney(stats?.todayIncome ?? 0)}</h3>
                            </div>
                        </div>

                        <div className="finance-card unpaid" onClick={() => navigate('/accounting/billing')} style={{ cursor: 'pointer' }}>
                            <div className="card-icon">
                                <FiFileText />
                            </div>
                            <div className="card-meta">
                                <p>Unpaid Balance</p>
                                <h3>{formatMoney(stats?.pendingPayments ?? 0)}</h3>
                            </div>
                        </div>

                        <div className="finance-card revenue" onClick={() => navigate('/accounting/reports')} style={{ cursor: 'pointer' }}>
                            <div className="card-icon">
                                <FiTrendingUp />
                            </div>
                            <div className="card-meta">
                                <p>Total Revenue</p>
                                <h3>{formatMoney(stats?.totalRevenue ?? 0)}</h3>
                            </div>
                        </div>

                        <div className="finance-card pending" onClick={() => navigate('/accounting/billing')} style={{ cursor: 'pointer' }}>
                            <div className="card-icon">
                                <FiCreditCard />
                            </div>
                            <div className="card-meta">
                                <p>Pending Invoices</p>
                                <h3>{stats?.pendingInvoicesCount ?? 0}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="accounting-split-grid">
                        <div className="activity-card content-card">
                            <div className="activity-header">
                                <h2>Recent Invoices</h2>
                                <button className="btn-view-all" onClick={() => navigate('/accounting/billing')}>
                                    View Detailed List <FiArrowRight />
                                </button>
                            </div>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Invoice #</th>
                                            <th>Patient Name</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentInvoices.length > 0 ? recentInvoices.map((inv) => (<tr key={inv.id}>
                                                <td><strong style={{ color: '#2563EB' }}>{inv.id}</strong></td>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                                                        {inv.patient?.name ?? 'Anonymous'}
                                                    </div>
                                                </td>
                                                <td><strong style={{ fontSize: '1.05rem' }}>{formatMoney(inv.totalAmount || inv.amount)}</strong></td>
                                                <td>
                                                    <span className={`status-pill ${inv.status?.toLowerCase() || 'pending'}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                                                    {new Date(inv.createdAt || inv.date).toLocaleDateString()}
                                                </td>
                                            </tr>)) : (<tr>
                                                <td colSpan={5} className="text-center p-xl text-muted italic">
                                                    No recent financial transactions found.
                                                </td>
                                            </tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="actions-card content-card">
                            <div className="activity-header">
                                <h2>Quick Actions</h2>
                            </div>
                            <div className="actions-list">
                                <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.5rem' }}>Core Administrative Tasks</p>
                                <button className="action-btn primary" onClick={() => navigate('/accounting/billing')}>
                                    <FiCreditCard /> Manage Invoices
                                </button>
                                <button className="action-btn secondary" onClick={() => navigate('/accounting/reports')}>
                                    <FiTrendingUp /> Detailed Reports
                                </button>

                                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                                        <FiActivity style={{ color: '#3b82f6' }}/> Status Monitor
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                                        <span style={{ color: '#64748b' }}>Overdue Invoices:</span>
                                        <span style={{ color: '#ef4444', fontWeight: '700' }}>0</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                                        <span style={{ color: '#64748b' }}>Unallocated Credits:</span>
                                        <span style={{ color: '#10b981', fontWeight: '700' }}>{formatMoney(0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>)}
        </div>);
};
export default AccountingDashboard;
