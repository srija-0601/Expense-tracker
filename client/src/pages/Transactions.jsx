import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineFunnel, HiOutlineXMark } from 'react-icons/hi2';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Transactions.css';

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Salary','Freelance','Investment','Housing','Other'];
const EXPENSE_CATS = ['Food','Transport','Shopping','Entertainment','Bills','Health','Education','Housing','Other'];
const INCOME_CATS = ['Salary','Freelance','Investment','Other'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ category: '', type: '', search: '', startDate: '', endDate: '' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ amount: '', category: 'Food', type: 'expense', date: new Date().toISOString().split('T')[0], notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchTransactions(); }, [page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setTotalPages(data.totalPages);
    } catch (err) { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ amount: '', category: 'Food', type: 'expense', date: new Date().toISOString().split('T')[0], notes: '' });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t._id);
    setForm({ amount: t.amount, category: t.category, type: t.type, date: t.date.split('T')[0], notes: t.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) return toast.error('Enter a valid amount');
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/transactions/${editing}`, { ...form, amount: Number(form.amount) });
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', { ...form, amount: Number(form.amount) });
        toast.success('Transaction added');
      }
      setShowModal(false);
      fetchTransactions();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      fetchTransactions();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const formatCurrency = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  const clearFilters = () => { setFilters({ category: '', type: '', search: '', startDate: '', endDate: '' }); setPage(1); };

  const activeCats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div><h1>Transactions</h1><p>Manage your income and expenses</p></div>
        <button className="btn btn-primary" onClick={openAdd} id="add-transaction-btn"><HiOutlinePlus /> Add Transaction</button>
      </div>

      <div className="filters-bar card">
        <div className="filter-row">
          <div className="search-wrap">
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input className="input-field search-input" placeholder="Search notes..." value={filters.search}
              onChange={(e) => { setFilters({...filters, search: e.target.value}); setPage(1); }} />
          </div>
          <select className="input-field filter-select" value={filters.type} onChange={(e) => { setFilters({...filters, type: e.target.value}); setPage(1); }}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="input-field filter-select" value={filters.category} onChange={(e) => { setFilters({...filters, category: e.target.value}); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" className="input-field filter-date" value={filters.startDate} onChange={(e) => { setFilters({...filters, startDate: e.target.value}); setPage(1); }} />
          <input type="date" className="input-field filter-date" value={filters.endDate} onChange={(e) => { setFilters({...filters, endDate: e.target.value}); setPage(1); }} />
          {(filters.category || filters.type || filters.search || filters.startDate || filters.endDate) && (
            <button className="btn btn-secondary" onClick={clearFilters}><HiOutlineXMark /> Clear</button>
          )}
        </div>
      </div>

      <div className="card txn-table-card">
        {loading ? (
          <div className="table-loading">{[1,2,3,4,5].map(i => <div key={i} className="skeleton row-skeleton" />)}</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><p>No transactions found</p></div>
        ) : (
          <>
            <div className="txn-table-wrap">
              <table className="txn-table">
                <thead><tr><th>Date</th><th>Category</th><th>Notes</th><th>Type</th><th>Amount</th><th>Actions</th></tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id} className={`txn-row txn-${t.type}`}>
                      <td>{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>{t.category}</td>
                      <td className="text-muted">{t.notes || '-'}</td>
                      <td><span className={`badge badge-${t.type}`}>{t.type}</span></td>
                      <td className={t.type === 'income' ? 'text-income' : 'text-expense'}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => openEdit(t)} title="Edit"><HiOutlinePencil /></button>
                          <button className="btn-icon" onClick={() => handleDelete(t._id)} title="Delete"><HiOutlineTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><HiOutlineXMark /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="type-toggle">
                <button type="button" className={`toggle-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                  onClick={() => setForm({...form, type: 'expense', category: 'Food'})}>Expense</button>
                <button type="button" className={`toggle-btn ${form.type === 'income' ? 'active income' : ''}`}
                  onClick={() => setForm({...form, type: 'income', category: 'Salary'})}>Income</button>
              </div>
              <div className="input-group">
                <label>Amount (₹)</label>
                <input type="number" className="input-field" placeholder="0.00" min="0.01" step="0.01"
                  value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select className="input-field" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                  {activeCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Date</label>
                <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Notes (optional)</label>
                <textarea className="input-field" rows={2} placeholder="Add a note..." maxLength={200}
                  value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={submitting} id="save-transaction-btn">
                {submitting ? <span className="btn-loader" /> : (editing ? 'Update' : 'Add Transaction')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
