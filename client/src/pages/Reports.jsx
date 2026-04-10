import { useState, useEffect } from 'react';
import { HiOutlineDocumentArrowDown, HiOutlineCalendar } from 'react-icons/hi2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Reports.css';

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);
  const [yearly, setYearly] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, yearRes, txnRes] = await Promise.all([
        api.get('/analytics/summary', { params: { month } }),
        api.get('/analytics', { params: { months: 12 } }),
        api.get('/transactions', { params: { limit: 1000 } }),
      ]);
      setSummary(sumRes.data);
      setYearly(yearRes.data);
      setTransactions(txnRes.data.transactions || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const fmtMonth = (m) => { if (!m) return ''; const [y, mo] = m.split('-'); return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1] + ' ' + y.slice(2); };

  const exportCSV = () => {
    if (!transactions.length) return toast.error('No data to export');
    const headers = ['Date','Category','Type','Amount','Notes'];
    const rows = transactions.map(t => [new Date(t.date).toLocaleDateString(), t.category, t.type, t.amount, t.notes || '']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `expense-report-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const exportPDF = async () => {
    if (!transactions.length) return toast.error('No data to export');
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      doc.setFontSize(20); doc.text('Expense Report', 14, 22);
      doc.setFontSize(11); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleDateString()} | Month: ${month}`, 14, 30);
      if (summary) {
        doc.setFontSize(12); doc.setTextColor(0);
        doc.text(`Income: ${fmt(summary.income)}  |  Expenses: ${fmt(summary.expense)}  |  Savings: ${fmt(summary.savings)}`, 14, 42);
      }
      autoTable(doc, {
        startY: 50,
        head: [['Date', 'Category', 'Type', 'Amount', 'Notes']],
        body: transactions.map(t => [new Date(t.date).toLocaleDateString(), t.category, t.type, fmt(t.amount), t.notes || '-']),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [124, 58, 237] },
      });
      doc.save(`expense-report-${month}.pdf`);
      toast.success('PDF downloaded');
    } catch (err) { toast.error('PDF generation failed'); console.error(err); }
  };

  if (loading) return <div className="page animate-fade-in"><div className="skeleton" style={{height:400}} /></div>;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div><h1>Reports</h1><p>Monthly summaries and export options</p></div>
        <div className="report-actions">
          <input type="month" className="input-field" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn btn-secondary" onClick={exportCSV} id="export-csv"><HiOutlineDocumentArrowDown /> CSV</button>
          <button className="btn btn-primary" onClick={exportPDF} id="export-pdf"><HiOutlineDocumentArrowDown /> PDF</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card report-stat"><span className="stat-label">Income</span><span className="stat-value text-income">{fmt(summary?.income)}</span></div>
        <div className="card report-stat"><span className="stat-label">Expenses</span><span className="stat-value text-expense">{fmt(summary?.expense)}</span></div>
        <div className="card report-stat"><span className="stat-label">Savings</span><span className="stat-value" style={{color:'var(--color-savings)'}}>{fmt(summary?.savings)}</span></div>
        <div className="card report-stat"><span className="stat-label">Transactions</span><span className="stat-value">{summary?.transactions || 0}</span></div>
      </div>

      <div className="card chart-card">
        <h3>Yearly Overview</h3>
        <p className="chart-subtitle">Income, expenses & savings over 12 months</p>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tickFormatter={fmtMonth} stroke="var(--color-text-muted)" fontSize={12} />
              <YAxis stroke="var(--color-text-muted)" fontSize={12} tickFormatter={(v) => '₹'+(v/1000)+'k'} />
              <Tooltip contentStyle={{ background:'var(--color-surface-solid)', border:'1px solid var(--color-border)', borderRadius:12, color:'var(--color-text)' }} formatter={(v) => fmt(v)} labelFormatter={fmtMonth} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ r:4 }} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ r:4 }} name="Expense" />
              <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} dot={{ r:4 }} name="Savings" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
