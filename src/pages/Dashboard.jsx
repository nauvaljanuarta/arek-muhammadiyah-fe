import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import API_BASE_URL from '../config';
import GeoJSONMap from '../components/GeoJSONMap';
import LoadingSkeleton from '../components/LoadingSkeleton';
import InfoWindow from '../components/InfoWindow';

function Dashboard({ onNavigate }) {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [cityStatsData, setCityStatsData] = useState({});
  const [wilayahData, setWilayahData] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loadingCities, setLoadingCities] = useState({});
  const [dashboardStats, setDashboardStats] = useState({
    total_users: 0,
    total_articles: 0,
    total_tickets: 0,
    total_villages: 0,
    ticket_stats: {
      unread: 0,
      read: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      total: 0
    },
  });
  const [hoverInfo, setHoverInfo] = useState({
    visible: false,
    cityName: "",
    cityId: "",
    data: {},
    position: { x: 0, y: 0 },
  });

  const jawaTimurCityIds = [
    "3501", "3502", "3503", "3504", "3505", "3506", "3507", "3508", "3509", "3510",
    "3511", "3512", "3513", "3514", "3515", "3516", "3517", "3518", "3519", "3520",
    "3521", "3522", "3523", "3524", "3525", "3526", "3527", "3528", "3529",
    "3571", "3572", "3573", "3574", "3575", "3576", "3577", "3578", "3579"
  ];

  useEffect(() => {
    console.log('Dashboard mounted');
    fetchDashboardStats();
    loadWilayahData();
    loadGeoJSON();
    fetchAllCityStats();
  }, []);

  const fetchCityStats = async (cityId) => {
    try {
      const response = await axiosInstance.get(`/api/stats/${cityId}`);
      if (response.data.success && response.data.data) return response.data.data;
      return null;
    } catch (error) {
      console.error(`Error fetching stats for city ${cityId}:`, error);
      return null;
    }
  };

  const fetchAllCityStats = async () => {
    const statsPromises = jawaTimurCityIds.map(cityId => fetchCityStats(cityId));
    try {
      const results = await Promise.all(statsPromises);
      const statsMap = {};
      results.forEach((data, index) => {
        if (data) statsMap[jawaTimurCityIds[index]] = data;
      });
      setCityStatsData(statsMap);
    } catch (error) {
      console.error('Error fetching all city stats:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axiosInstance.get('/api/dashboard/stats');
      if (response.data.success) setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadWilayahData = async () => {
    try {
      const response = await fetch("/data/wilayah.json");
      if (response.ok) {
        const data = await response.json();
        setWilayahData(data);
      }
    } catch (error) { console.warn('Error loading wilayah.json:', error); }
  };

  const loadGeoJSON = async () => {
    try {
      setLoading(true);
      setTimeout(async () => {
        try {
          const response = await fetch("/data/Kabupaten.json");
          if (!response.ok) throw new Error('File GeoJSON tidak ditemukan');
          const data = await response.json();
          setGeoJsonData(data);
        } catch (error) {
          console.error("Gagal memuat GeoJSON:", error);
          setGeoJsonData({ type: "FeatureCollection", features: [] });
        } finally { setLoading(false); }
      }, 800);
    } catch (error) { setLoading(false); }
  };

  const handleCityClick = async (cityName, cityId) => {
    if (cityStatsData[cityId]) {
      setSelectedCity({ name: cityName, id: cityId, data: cityStatsData[cityId] });
      return;
    }
    setLoadingCities(prev => ({ ...prev, [cityId]: true }));
    const data = await fetchCityStats(cityId);
    setLoadingCities(prev => ({ ...prev, [cityId]: false }));
    if (data) {
      setCityStatsData(prev => ({ ...prev, [cityId]: data }));
      setSelectedCity({ name: cityName, id: cityId, data: data });
    } else {
      setSelectedCity({
        name: cityName, id: cityId,
        data: { total_users: 0, ticket_stats: { unread: 0, read: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 } }
      });
    }
  };

  const handleCityHover = (cityName, cityId, cityData, event) => {
    const containerPoint = event.containerPoint;
    setHoverInfo({
      visible: true, cityName: cityName, cityId: cityId,
      data: cityData || { total_users: 0, ticket_stats: { total: 0 } },
      position: { x: containerPoint.x + 10, y: containerPoint.y - 10 },
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo((prev) => ({ ...prev, visible: false }));
  };

  // Helper styles for clickable cards
  const clickableCardStyle = { cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' };
  const handleCardHover = (e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'; };
  const handleCardLeave = (e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard Jawa Timur</h1>
        <p style={{ color: '#6b7280', fontSize: '0.95em', marginTop: '8px' }}>
          Sistem Informasi Anggota Muhammadiyah - Provinsi Jawa Timur
        </p>
      </div>

      {/* Main Stats Cards - Added onClick handlers */}
      <div className="stats-grid" style={{ marginTop: '24px' }}>
        <div
          className="stat-card"
          style={{ ...clickableCardStyle, borderLeftColor: '#3b82f6' }}
          onClick={() => onNavigate('anggota-terdaftar')}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
          title="Klik untuk melihat Anggota Terdaftar"
        >
          <h3>Total Anggota</h3>
          <div className="stat-value">
            {statsLoading ? 'Memuat...' : (dashboardStats.total_users -1).toLocaleString()}
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            Anggota Terdaftar
          </p>
        </div>

        <div
          className="stat-card"
          style={{ ...clickableCardStyle, borderLeftColor: '#dc2626' }}
          onClick={() => onNavigate('tiket', { status: 'unread' })}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
          title="Klik untuk melihat Tiket Belum Dibaca"
        >
          <h3>Tiket Belum Dibaca</h3>
          <div className="stat-value" style={{ color: '#dc2626' }}>
            {statsLoading ? 'Memuat...' : dashboardStats.ticket_stats.unread}
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            Perlu Perhatian
          </p>
        </div>

        <div
          className="stat-card"
          style={{ ...clickableCardStyle, borderLeftColor: '#f59e0b' }}
          onClick={() => onNavigate('tiket', { status: 'read' })}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
          title="Klik untuk melihat Tiket Sudah Dibaca"
        >
          <h3>Tiket Sudah Dibaca</h3>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {statsLoading ? 'Memuat...' : dashboardStats.ticket_stats.read}
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            Menunggu Tindakan
          </p>
        </div>

        <div
          className="stat-card"
          style={{ ...clickableCardStyle, borderLeftColor: '#3b82f6' }}
          onClick={() => onNavigate('tiket', { status: 'in_progress' })}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
          title="Klik untuk melihat Tiket Diproses"
        >
          <h3>Tiket Diproses</h3>
          <div className="stat-value" style={{ color: '#3b82f6' }}>
            {statsLoading ? 'Memuat...' : dashboardStats.ticket_stats.in_progress}
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            Sedang Ditangani
          </p>
        </div>

        <div
          className="stat-card"
          style={{ ...clickableCardStyle, borderLeftColor: '#10b981' }}
          onClick={() => onNavigate('tiket', { status: 'resolved' })}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
          title="Klik untuk melihat Tiket Selesai"
        >
          <h3>Tiket Selesai</h3>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {statsLoading ? 'Memuat...' : dashboardStats.ticket_stats.resolved}
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
            Terselesaikan
          </p>
        </div>
      </div>

      {/* Map Section */}
      <div className="map-section" onMouseLeave={handleMouseLeave}>
        <h3>Peta Sebaran Anggota Jawa Timur</h3>
        <div className="map-container">
          {loading ? (
            <LoadingSkeleton />
          ) : geoJsonData ? (
            <GeoJSONMap
              geoJsonData={geoJsonData}
              cityStatsData={cityStatsData}
              wilayahData={wilayahData}
              onCityClick={handleCityClick}
              onCityHover={handleCityHover}
            />
          ) : (
            <div className="loading">Gagal memuat data peta.</div>
          )}

          <InfoWindow
            visible={hoverInfo.visible}
            title={hoverInfo.cityName}
            data={{
              members: hoverInfo.data.total_users || 0,
              tickets: hoverInfo.data.ticket_stats?.total || 0
            }}
            position={hoverInfo.position}
          />
        </div>

        {selectedCity && (
          <div className="city-stats-detail">
            <h4>{selectedCity.name}</h4>
            <p style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '12px' }}>ID: {selectedCity.id}</p>
            {loadingCities[selectedCity.id] ? (
              <p style={{ color: '#6b7280' }}>Memuat data...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <p><strong>Total Anggota:</strong> {selectedCity.data.total_users?.toLocaleString() || '0'}</p>
                  <p><strong>Total Tiket:</strong> {selectedCity.data.ticket_stats?.total || '0'}</p>
                </div>
                <div className="ticket-breakdown">
                  <span style={{ color: '#dc2626' }}>Belum Dibaca: {selectedCity.data.ticket_stats?.unread || '0'}</span>
                  <span style={{ color: '#f59e0b' }}>Sudah Dibaca: {selectedCity.data.ticket_stats?.read || '0'}</span>
                  <span style={{ color: '#3b82f6' }}>Diproses: {selectedCity.data.ticket_stats?.in_progress || '0'}</span>
                  <span style={{ color: '#10b981' }}>Selesai: {selectedCity.data.ticket_stats?.resolved || '0'}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;