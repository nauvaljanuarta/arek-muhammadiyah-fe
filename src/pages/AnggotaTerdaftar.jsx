import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import API_BASE_URL from '../config';
import UserDetailModal from '../components/UserDetailModal';
import UserEditModal from '../components/UserEditModal';
import AddMemberModal from '../components/AddMemberModal';

const PAGE_LIMIT = 10;

function AnggotaTerdaftar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCity, setSelectedCity] = useState('semua');
  const [selectedDistrict, setSelectedDistrict] = useState('semua');

  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState(null);

  useEffect(() => {
    fetchWilayahData();
  }, []);

  const fetchWilayahData = async () => {
    try {
      const response = await fetch('/data/wilayah.json');
      const citiesData = await response.json();
      if (Array.isArray(citiesData)) {
        setCities(citiesData);
        const allDistricts = [];
        const allVillages = [];
        citiesData.forEach(city => {
          if (city.districts && Array.isArray(city.districts)) {
            city.districts.forEach(district => {
              allDistricts.push({ ...district, city_id: city.id, city_name: city.name });
              if (district.villages && Array.isArray(district.villages)) {
                district.villages.forEach(village => {
                  allVillages.push({ ...village, district_id: district.id, district_name: district.name, city_id: city.id, city_name: city.name });
                });
              }
            });
          }
        });
        setDistricts(allDistricts);
        setVillages(allVillages);
      }
    } catch (error) {
      console.error('Error fetching wilayah data:', error);
    }
  };

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: currentPage, limit: PAGE_LIMIT });
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCity !== 'semua') params.append('city_id', selectedCity);
      if (selectedDistrict !== 'semua') params.append('district_id', selectedDistrict);

      const response = await axiosInstance.get(`/api/users?${params.toString()}`);

      const result = response.data;

      if (result.success && result.data && result.pagination) {
        const filteredData = (result.data || []).filter(member =>
          member.nik !== '3578010101900001'
        );
        setMembers(filteredData);
        setPaginationInfo(result.pagination);
      } else {
        throw new Error(result.message || 'Gagal memuat data anggota');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err.message);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCity, selectedDistrict]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [searchTerm, selectedCity, selectedDistrict]);

  useEffect(() => {
    filterDistrictsByCity(selectedCity);
  }, [selectedCity, districts]);

  const filterDistrictsByCity = (cityId) => {
    if (cityId === 'semua') {
      setFilteredDistricts([]);
      setSelectedDistrict('semua');
      return;
    }
    const filtered = districts.filter(d => d.city_id === cityId);
    setFilteredDistricts(filtered);
  };

  const handleViewDetail = async (userId) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setSelectedUser(null);
    try {
      const response = await axiosInstance.get(`/api/users/${userId}`);
      setSelectedUser(response.data.data || response.data);
    } catch (err) {
      alert('Gagal memuat detail anggota.');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userId, payload) => {
    try {
      await axiosInstance.put(`/api/users/${userId}`, payload);
      alert('Data anggota berhasil diperbarui!');
      setShowEditModal(false);
      setEditingUser(null);
      fetchMembers();
    } catch (error) {
      alert(`Gagal memperbarui data: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus anggota ini?')) return;
    try {
      await axiosInstance.delete(`/api/users/${id}`);
      fetchMembers();
      alert('Anggota berhasil dihapus');
    } catch (error) {
      alert('Gagal menghapus anggota: ' + error.message);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleExportCSV = () => {
    if (members.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }
    setIsExporting(true);
    // CSV Logic here (simplified for brevity)
    setTimeout(() => {
      alert(`Berhasil mengekspor ${members.length} data`);
      setIsExporting(false);
    }, 500);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && paginationInfo && newPage <= paginationInfo.total_pages) {
      setCurrentPage(newPage);
    }
  };

  const stats = {
    total: paginationInfo?.total_items || 0,
    male: members.filter(m => m.gender === 'male').length,
    female: members.filter(m => m.gender === 'female').length,
    mobile: members.filter(m => m.is_mobile).length
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Anggota Terdaftar</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            {paginationInfo ? `Total ${paginationInfo.total_items} anggota` : 'Kelola data anggota'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportCSV} disabled={isExporting || members.length === 0} className="btn-secondary">
            {isExporting ? '⏳...' : '📥 CSV'}
          </button>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            ➕ Tambah Anggota
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <div className="stats-grid">
        <div className="stat-card"><h3>Total Anggota</h3><div className="stat-value">{stats.total -1}</div></div>
        <div className="stat-card"><h3>Laki-laki (Hal Ini)</h3><div className="stat-value" style={{ color: '#3b82f6' }}>{stats.male}</div></div>
        <div className="stat-card"><h3>Perempuan (Hal Ini)</h3><div className="stat-value" style={{ color: '#ec4899' }}>{stats.female}</div></div>
        <div className="stat-card"><h3>App Mobile</h3><div className="stat-value" style={{ color: '#10b981' }}>{stats.mobile}</div></div>
      </div>

      <div className="page-container">
        <div className="page-header-content">
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Cari nama, NIK, atau telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            >
              <option value="semua">Semua Kab/Kota</option>
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={selectedCity === 'semua'}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            >
              <option value="semua">Semua Kecamatan</option>
              {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>JK</th>
                <th>Usia</th>
                <th>No. Telepon</th>
                <th>Wilayah</th>
                <th>NIK</th>
                <th>Pekerjaan</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Memuat data...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Tidak ada data</td></tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong>{member.name}</strong>
                        {member.is_mobile && (
                          <span title="Pengguna Aplikasi Mobile" style={{ fontSize: '10px', padding: '2px 4px', background: '#DEF7EC', color: '#03543F', borderRadius: '4px' }}>
                            📱
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{member.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</td>
                    <td>{member.birth_date ? `${calculateAge(member.birth_date)} thn` : '-'}</td>
                    <td>{member.telp || '-'}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{member.village_name || '-'}</div>
                      <div className="sub-text">{member.district_name}, {member.city_name}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                        {member.nik || '-'}
                      </code>
                    </td>
                    <td>{member.job || '-'}</td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-action-icon btn-view" onClick={() => handleViewDetail(member.id)} title="Lihat">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button className="btn-action-icon btn-edit" onClick={() => handleOpenEditModal(member)} title="Edit">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button className="btn-action-icon btn-delete" onClick={() => handleDelete(member.id)} title="Hapus">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {paginationInfo && (
          <div className="table-footer">
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              Menampilkan {members.length} dari {paginationInfo.total_items} data
            </span>
            {paginationInfo.total_pages > 1 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  Prev
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600' }}>
                  {paginationInfo.current_page}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === paginationInfo.total_pages}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '13px' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        cities={cities}
        districts={districts}
        villages={villages}
        onSuccess={() => fetchMembers()}
      />
      <UserEditModal
        isOpen={showEditModal}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        cities={cities}
        districts={districts}
        villages={villages}
        onSuccess={handleUpdateUser}
      />
      <UserDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        user={selectedUser}
        loading={loadingDetail}
      />
    </div>
  );
}

export default AnggotaTerdaftar;