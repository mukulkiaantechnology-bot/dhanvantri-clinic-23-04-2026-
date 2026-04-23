import { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiFileText } from 'react-icons/fi';
import { doctorService } from '../../services/doctor.service';
import { useCurrency } from '../../context/CurrencyContext';
import './Dashboard.css';
import './Revenue.css';
const Revenue = () => {
    const { formatMoney } = useCurrency();
    const [viewMode, setViewMode] = useState('daily');
    const [startDate, setStartDate] = useState('2026-01-01');
    const [endDate, setEndDate] = useState('2026-01-13');
    const [, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        thisMonth: 0,
        today: 0,
        totalConsultations: 0,
        chartData: []
    });
    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const res = await doctorService.getRevenue();
                setStats(res.data);
            }
            catch (error) {
                console.error('Failed to fetch revenue', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchRevenue();
    }, []);
    const { totalEarnings, thisMonth, todayEarnings, completedCount, chartData } = {
        totalEarnings: stats.totalEarnings || 0,
        thisMonth: stats.thisMonth || 0,
        todayEarnings: stats.today || 0,
        completedCount: stats.totalConsultations || 0,
        chartData: stats.chartData || []
    };
    return (<div className="doctor-dashboard">
            {/* Page Header */}
            <div className="revenue-page-header">
                <div>
                    <h1 className="revenue-title">Earnings</h1>
                    <p className="revenue-subtitle">Your earnings and consultation history</p>
                </div>
                <button className="btn-export">
                    <FiFileText />
                    Export Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="revenue-stats-grid">
                <div className="revenue-stat-card">
                    <div className="stat-icon-revenue dollar">
                        <FiDollarSign />
                    </div>
                    <p className="stat-label-revenue">Total Earnings</p>
                    <h3 className="stat-value-revenue">{formatMoney(totalEarnings)}</h3>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <FiCalendar />
                    </div>
                    <div className="stat-content">
                        <h3>Monthly Revenue</h3>
                        <p className="stat-value">{formatMoney(thisMonth)}</p>
                        <span className="stat-trend positive">
                            <FiTrendingUp /> +12%
                        </span>
                    </div>
                </div>
                <div className="revenue-stat-card">
                    <div className="stat-icon-revenue calendar">
                        <FiCalendar />
                    </div>
                    <p className="stat-label-revenue">Today</p>
                    <h3 className="stat-value-revenue">{formatMoney(todayEarnings)}</h3>
                </div>
                <div className="revenue-stat-card">
                    <div className="stat-icon-revenue consultations">
                        <FiTrendingUp />
                    </div>
                    <p className="stat-label-revenue">Total Consultations</p>
                    <h3 className="stat-value-revenue">{completedCount}</h3>
                </div>
            </div>

            {/* Filters Section */}
            <div className="revenue-filters-card">
                <h3 className="filters-title">Filters</h3>
                <div className="filters-row">
                    <div className="filter-group">
                        <label>Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
                    </div>
                    <div className="filter-group">
                        <label>End Date</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                    </div>
                    <div className="filter-actions">
                        <button className="btn-reset">Reset</button>
                        <button className="btn-apply">
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Earnings Trend Chart */}
            <div className="revenue-chart-card">
                <div className="chart-header">
                    <h3>Earnings Trend</h3>
                    <div className="chart-view-toggle">
                        <button className={`toggle-btn ${viewMode === 'daily' ? 'active' : ''}`} onClick={() => setViewMode('daily')}>
                            Daily
                        </button>
                        <button className={`toggle-btn ${viewMode === 'monthly' ? 'active' : ''}`} onClick={() => setViewMode('monthly')}>
                            Monthly
                        </button>
                    </div>
                </div>

                <div className="chart-area">
                    <div className="chart-bars-revenue">
                        {chartData.map((item, index) => (<div key={index} className="bar-group">
                                <div className="bar-wrapper">
                                    <div className="bar-fill" style={{ height: `${item.visits * 10 || 5}%` }}></div>
                                </div>
                                <div className="bar-label">
                                    <span className="bar-date">{item.date}</span>
                                    <span className="bar-value">{item.visits} visits</span>
                                </div>
                            </div>))}
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="revenue-transactions-card">
                <h3 className="transactions-title">Transaction History</h3>
                <div className="transactions-empty">
                    <p>0 transactions</p>
                </div>
            </div>
        </div>);
};
export default Revenue;
