import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineHome, HiOutlineCreditCard, HiOutlineChartPie, HiOutlineDocumentText } from 'react-icons/hi2';

const navItems = [
  { path: '/', label: 'Dashboard', icon: HiOutlineHome },
  { path: '/transactions', label: 'Transactions', icon: HiOutlineCreditCard },
  { path: '/budgets', label: 'Budgets', icon: HiOutlineChartPie },
  { path: '/reports', label: 'Reports', icon: HiOutlineDocumentText },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-brand">
          <div className="logo-icon">$</div>
          <h2>ExpenseFlow</h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">{getInitials(user?.name)}</div>
          <div className="sidebar-user-info">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
        </div>
      </aside>
    </>
  );
}
