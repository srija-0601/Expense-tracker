import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Budgets.css';

const CATS = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Housing','Other'];

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ category: 'Food', limit: '' });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchBudgets(); }, [month]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/budgets', { params: { month } });
      setBudgets(data);
    } catch (err) { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.limit || form.limit <= 0) return toast.error('Enter a valid limit');
    setAdding(true);
    try {
      await api.post('/budgets', { category: form.category, limit: Number(form.limit), month });
      toast.success('Budget saved');
      setForm({ category: 'Food', limit: '' });
      setShowForm(false);
      fetchBudgets();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget removed');
      fetchBudgets();
    } catch (err) { toast.error('Failed'); }
  };

  const formatCurrency = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const getBarColor = (pct) => {
    if (pct >= 100) return '#ef4444';
    if (pct >= 80) return '#f59e0b';
    if (pct >= 50) return '#3b82f6';
    return '#10b981';
  };

  const getStatus = (pct) => {
    if (pct >= 100) return { label: 'Exceeded!', cls: 'status-danger' };
    if (pct >= 80) return { label: 'Warning', cls: 'status-warning' };
    return { label: 'On Track', cls: 'status-ok' };
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div><h1>Budgets</h1><p>Set and track monthly spending limits</p></div>
        <div className="budget-header-actions">
          <input type="month" className="input-field" value={month} onChange={(e) => setMonth(e.target.value)} id="budget-month" />
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} id="add-budget-btn">
            <HiOutlinePlus /> Add Budget
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card budget-form-card animate-slide-up">
          <form onSubmit={handleAdd} className="budget-form">
            <div className="input-group">
              <label>Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Monthly Limit (₹)</label>
              <input type="number" className="input-field" placeholder="5000" min="1"
                value={form.limit} onChange={(e) => setForm({...form, limit: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={adding} id="save-budget-btn">
              {adding ? <span className="btn-loader" /> : 'Save Budget'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="budget-grid">{[1,2,3].map(i => <div key={i} className="skeleton" style={{height:180}} />)}</div>
      ) : budgets.length === 0 ? (
        <div className="card empty-state"><p>No budgets set for {month}. Add one to start tracking!</p></div>
      ) : (
        <div className="budget-grid">
          {budgets.map((b) => {
            const status = getStatus(b.percentage);
            const barColor = getBarColor(b.percentage);
            return (
              <div className="card budget-card" key={b._id}>
                <div className="budget-card-top">
                  <div>
                    <h3>{b.category}</h3>
                    <span className={`budget-status ${status.cls}`}>
                      {b.percentage >= 100 && <HiOutlineExclamationTriangle />}
                      {status.label}
                    </span>
                  </div>
                  <button className="btn-icon" onClick={() => handleDelete(b._id)} title="Delete"><HiOutlineTrash /></button>
                </div>
                <div className="budget-amounts">
                  <span className="budget-spent">{formatCurrency(b.spent)}</span>
                  <span className="budget-limit">/ {formatCurrency(b.limit)}</span>
                </div>
                <div className="budget-bar-track">
                  <div className="budget-bar-fill" style={{ width: `${Math.min(b.percentage, 100)}%`, background: barColor }} />
                </div>
                <span className="budget-pct" style={{ color: barColor }}>{b.percentage}% used</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
