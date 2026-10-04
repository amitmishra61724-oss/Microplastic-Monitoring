import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Microscope, FlaskConical, History, Info, Activity } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Activity size={24} />
          <span>Microplastic AI</span>
        </div>
        
        <nav>
          <ul className="nav-menu">
            <li>
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/analysis" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Microscope size={18} />
                <span>Image Analysis</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/samples" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FlaskConical size={18} />
                <span>Sample Registry</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <History size={18} />
                <span>Analysis History</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Info size={18} />
                <span>About System</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="page-title">AI-Based Microplastic Monitoring System</div>
          <span className="placeholder-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            System Online • AI Active
          </span>
        </header>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
