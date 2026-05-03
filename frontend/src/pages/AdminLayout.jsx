import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" style={{ width: '100%', maxWidth: '140px' }} />
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            📊 Dashboard
          </NavLink>
          <NavLink
            to="/admin/personnel"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            👥 Personel Listesi
          </NavLink>
        </nav>
        <button className="btn btn-ghost sidebar-logout" onClick={handleLogout}>
          🚪 Çıkış Yap
        </button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
