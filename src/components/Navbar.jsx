import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import API_BASE_URL from '../config';

function Navbar({ onLogout, toggleSidebar, onNavigate }) {
  const [userData, setUserData] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notificationCount, setNotificationCount] = useState(0);
  const [recentTickets, setRecentTickets] = useState([]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    fetchNavbarData();
    fetchNotificationData();

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNavbarData = async () => {
    try {
      const response = await axiosInstance.get('/api/auth/navbar');
      if (response.data.success) {
        setUserData(response.data.data.user);
      }
    } catch (err) {
      console.error('Error fetching navbar data:', err);
    }
  };

  const fetchNotificationData = async () => {
    try {
      const statsResponse = await axiosInstance.get('/api/dashboard/stats');

      if (statsResponse.data.success) {
        const stats = statsResponse.data.data.ticket_stats;
        setNotificationCount(stats.unread || 0);
      }

      const ticketsResponse = await axiosInstance.get('/api/tickets?page=1&limit=5&status=unread');

      if (ticketsResponse.data.success) {
        setRecentTickets(ticketsResponse.data.data || []);
      }

    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
      onLogout();
    }
  };

  const handleNotificationClick = (status) => {
    if (onNavigate) {
      onNavigate('tiket', { status: status });
      setShowNotifMenu(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'unread': return { text: 'Belum Dibaca', color: '#dc2626', bg: '#fee2e2' };
      case 'read': return { text: 'Sudah Dibaca', color: '#d97706', bg: '#fef3c7' };
      case 'in_progress': return { text: 'Diproses', color: '#2563eb', bg: '#dbeafe' };
      default: return { text: status, color: '#374151', bg: '#f3f4f6' };
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <img src="/img/logo.png" alt="Logo" className="navbar-logo" />
      </div>
      <div className="navbar-right">

        <div className="notification-wrapper" ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="notification-btn"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor" />
            </svg>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>

          {showNotifMenu && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h4>Tiket Belum Dibaca</h4>
              </div>
              <div className="dropdown-list">
                {recentTickets.length > 0 ? (
                  recentTickets.map(ticket => {
                    const statusStyle = getStatusLabel(ticket.status);
                    return (
                      <div
                        key={ticket.id}
                        className="notification-item"
                        onClick={() => handleNotificationClick(ticket.status)}
                      >
                        <div className="notif-status-indicator" style={{ backgroundColor: statusStyle.color }}></div>
                        <div className="notif-content">
                          <p className="notif-title">{ticket.title}</p>
                          <span
                            className="notif-badge"
                            style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}
                          >
                            {statusStyle.text}
                          </span>
                          <span className="notif-time">
                            {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="dropdown-empty">Tidak ada tiket baru</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-menu" ref={profileRef}>
          <button
            className="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              {userData?.name?.charAt(0) || 'U'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{userData?.name || 'User'}</span>
              <span className="profile-role">{userData?.role || 'Role'}</span>
            </div>
          </button>
          {showProfileMenu && (
            <div className="profile-dropdown">
              <button onClick={handleLogout} disabled={loading}>
                {loading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;