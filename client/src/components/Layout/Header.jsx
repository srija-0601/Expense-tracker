import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineSun, HiOutlineMoon, HiOutlineArrowRightOnRectangle, HiOutlineBars3 } from 'react-icons/hi2';

const pageTitles = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/budgets': 'Budgets',
  '/reports': 'Reports',
};

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('show');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar} id="menu-toggle">
          <HiOutlineBars3 />
        </button>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
            {pageTitles[location.pathname] || 'Dashboard'}
          </h1>
        </div>
      </div>
      <div className="header-right">
        <button className="theme-toggle" onClick={toggleTheme} id="theme-toggle" title="Toggle theme">
          {theme === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
        <button className="logout-btn" onClick={logout} id="logout-btn">
          <HiOutlineArrowRightOnRectangle />
          <span>Logout</span>
        </button>
      </div>
      <div className="sidebar-overlay" id="sidebar-overlay" onClick={toggleSidebar} />
    </header>
  );
}
