import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className={`admin-layout ${isMenuOpen ? 'menu-open' : ''}`}>
      {/* Mobil Menü Butonu */}
      <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? '✕' : '☰'}
      </button>

      {/* Karartma Overlay (Mobilde menü açıkken arkaya tıklayınca kapansın) */}
      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

      <aside className={`admin-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" style={{ width: '100%', maxWidth: '140px' }} />
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={closeMenu}
          >
            📊 Dashboard
          </NavLink>
          <NavLink
            to="/admin/personnel"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={closeMenu}
          >
            👥 Personel Listesi
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={closeMenu}
          >
            ⚙️ Ayarlar
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
