import React, { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import './App.css';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AnggotaTerdaftar from './pages/AnggotaTerdaftar';
import PenggunaMobile from './pages/PenggunaMobile';
import Kategori from './pages/Kategori';
import Tiket from './pages/Tiket';
import Artikel from './pages/Artikel';
import RegisterMemberPage from './pages/RegisterMemberPage';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ticketFilter, setTicketFilter] = useState('semua');
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedRefreshToken = localStorage.getItem('refresh_token');
    const savedRole = localStorage.getItem('role_id');

    const path = window.location.pathname;
    const isStandalone = path === '/input-anggota';

    if (savedToken) {
      setToken(savedToken);
      setRefreshToken(savedRefreshToken || '');
      setIsAuthenticated(true);
      if (savedRole) {
        setUserRole(parseInt(savedRole));
      }
    }

    if (isStandalone) {
      setIsStandaloneMode(true);
    } else {
      setIsStandaloneMode(false);
    }
  }, []);

  const handleLogin = (authToken, authRefreshToken, roleId) => {
    setToken(authToken);
    setRefreshToken(authRefreshToken);
    setIsAuthenticated(true);
    setUserRole(roleId);

    localStorage.setItem('access_token', authToken);
    localStorage.setItem('refresh_token', authRefreshToken);
    localStorage.setItem('role_id', roleId);

    if (window.location.pathname === '/input-anggota') {
      setIsStandaloneMode(true);
    }
  };

  const handleLogout = () => {
    setToken('');
    setRefreshToken('');
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role_id');
    setCurrentPage('dashboard');

    if (!isStandaloneMode) {
      // window.location.href = '/'; 
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePageNavigation = (page, params = {}) => {
    setCurrentPage(page);
    if (page === 'tiket' && params.status) {
      setTicketFilter(params.status);
    } else {
      setTicketFilter('semua');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (isStandaloneMode) {
    return (
      <RegisterMemberPage
        onLogout={handleLogout}
      />
    );
  }

  if (isAuthenticated && userRole !== 1) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        color: '#374151'
      }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>⛔ Akses Dashboard Dibatasi</h2>
          <p style={{ marginBottom: '20px' }}>Dashboard utama hanya untuk Administrator.</p>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '30px' }}>Role Anda saat ini: {userRole}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => {
                window.location.href = '/input-anggota';
              }}
              style={{
                padding: '12px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Buka Halaman Input Anggota
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: '12px 20px',
                background: '#374151',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        onLogout={handleLogout}
        toggleSidebar={toggleSidebar}
        onNavigate={handlePageNavigation}
      />
      <div className="main-layout">
        <Sidebar
          isOpen={sidebarOpen}
          currentPage={currentPage}
          setCurrentPage={(page) => handlePageNavigation(page)}
        />
        <div className={`content-area ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {currentPage === 'dashboard' && (
            <Dashboard onNavigate={handlePageNavigation} />
          )}
          {currentPage === 'anggota-terdaftar' && <AnggotaTerdaftar />}
          {currentPage === 'pengguna-mobile' && <PenggunaMobile />}
          {currentPage === 'kategori' && <Kategori />}
          {currentPage === 'tiket' && (
            <Tiket initialStatus={ticketFilter} />
          )}
          {currentPage === 'artikel' && <Artikel />}
        </div>
      </div>
    </div>
  );
}

export default App;