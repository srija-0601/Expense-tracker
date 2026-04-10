import { useState, useEffect } from 'react';
import { HiOutlineBanknotes, HiOutlineCreditCard, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineChartPie } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';
import './Dashboard.css';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sumRes, trendRes, catRes, recRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics'),
        api.get('/analytics/category'),
        api.get('/transactions?limit=5'),
      ]);
      setSummary(sumRes.data);
      setTrends(trendRes.data);
      setCategories(catRes.data);
      setRecent(recRes.data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n) => {
    if (n == null) return '₹0';
    return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatMonth = (m) => {
    if (!m) return '';
    const [y, mo] = m.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(mo) - 1] + ' ' + y.slice(2);
  };

  if (loading) {
    return (
      <div className="page animate-fade-in">
        <div className="stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton stat-skeleton" />)}
        </div>
        <div className="charts-grid">
          {[1,2].map(i => <div key={i} className="skeleton chart-skeleton" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Income', value: formatCurrency(summary?.income), change: summary?.incomeChange, icon: HiOutlineBanknotes, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Total Expenses', value: formatCurrency(summary?.expense), change: summary?.expenseChange, icon: HiOutlineCreditCard, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Net Savings', value: formatCurrency(summary?.savings), icon: HiOutlineArrowTrendingUp, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Transactions', value: summary?.transactions || 0, icon: HiOutlineChartPie, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your financial overview at a glance</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-card card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.icon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{s.label}</span>
              <span className="stat-value">{s.value}</span>
              {s.change != null && (
                <span className={`stat-change ${s.change >= 0 ? 'positive' : 'negative'}`}>
                  {s.change >= 0 ? <HiOutlineArrowTrendingUp size={14} /> : <HiOutlineArrowTrendingDown size={14} />}
                  {Math.abs(s.change)}% vs last month
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Monthly Trends</h3>
          <p className="chart-subtitle">Income vs Expenses (last 6 months)</p>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tickFormatter={formatMonth} stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(v) => '₹' + (v/1000) + 'k'} />
                <Tooltip contentStyle={{ background: 'var(--color-surface-solid)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text)' }} formatter={(v) => formatCurrency(v)} labelFormatter={formatMonth} />
                <Bar dataKey="income" fill="#10b981" radius={[6,6,0,0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[6,6,0,0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h3>Spending by Category</h3>
          <p className="chart-subtitle">This month's expense distribution</p>
          <div className="chart-wrap">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3} strokeWidth={0}>
                    {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-surface-solid)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text)' }} formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">No expense data this month</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-md)' }}>Recent Transactions</h3>
        {recent.length > 0 ? (
          <div className="recent-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Notes</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td><span className={`badge badge-${t.type}`}>{t.category}</span></td>
                    <td className="text-muted">{t.notes || '-'}</td>
                    <td className={t.type === 'income' ? 'text-income' : 'text-expense'}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">No transactions yet. Start by adding one!</p>
        )}
      </div>
    </div>
  );
}
