import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import UserDetailModal from '../components/UserDetailModal';

function PenggunaMobile() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('semua');
  const [cities, setCities] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchWilayah(); fetchMobileUsers();
  }, []);

  const fetchWilayah = async () => {
    try {
      const res = await axiosInstance.get('/api/cities');
      if (res.data.data) setCities(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchMobileUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/users/mobile');
      setUsers(response.data.data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleViewDetail = async (id) => {
    setShowModal(true); setLoadingDetail(true);
    try {
      const res = await axiosInstance.get(`/api/users/${id}`);
      setSelectedUser(res.data.data);
    } catch (e) { console.error(e); } finally { setLoadingDetail(false); }
  };

  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.telp?.includes(searchTerm)) &&
    (selectedCity === 'semua' || u.city_id === selectedCity)
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Pengguna Mobile App</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Daftar pengguna yang aktif menggunakan aplikasi</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><h3>Total Pengguna</h3><div className="stat-value" style={{ color: '#3b82f6' }}>{users.length}</div></div>
        <div className="stat-card"><h3>Aktif Login</h3><div className="stat-value" style={{ color: '#10b981' }}>{users.filter(u => u.is_active).length}</div></div>
      </div>

      <div className="page-container">
        <div className="page-header-content">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text" placeholder="Cari pengguna..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
              <option value="semua">Semua Kota</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Kontak</th>
                <th>Wilayah</th>
                <th>NIK</th>
                <th>Alamat</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr> :
                filtered.map(user => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <div style={{ fontSize: '10px', color: '#065f46', background: '#d1fae5', width: 'fit-content', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>Mobile App</div>
                    </td>
                    <td>📞 {user.telp || '-'}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{user.village_name}</div>
                      <div className="sub-text">{user.district_name}, {user.city_name}</div>
                    </td>
                    <td><code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{user.nik}</code></td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.address}</td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-action-icon btn-view" onClick={() => handleViewDetail(user.id)}>
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <UserDetailModal isOpen={showModal} onClose={() => setShowModal(false)} user={selectedUser} loading={loadingDetail} />}
    </div>
  );
}

export default PenggunaMobile;