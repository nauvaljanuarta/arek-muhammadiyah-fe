import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import FormTiketModal from '../components/FormTiketModal';
import DetailTiketModal from '../components/DetailTiketModal';

// Komponen Badge Internal untuk Status Tiket
const StatusBadge = ({ status }) => {
  const config = {
    'unread': { bg: '#fee2e2', color: '#991b1b', label: 'Belum Dibaca' },
    'read': { bg: '#fef3c7', color: '#92400e', label: 'Sudah Dibaca' },
    'in_progress': { bg: '#dbeafe', color: '#1e40af', label: 'Diproses' },
    'resolved': { bg: '#d1fae5', color: '#065f46', label: 'Selesai' },
    'rejected': { bg: '#f3f4f6', color: '#374151', label: 'Ditolak' }
  };

  const style = config[status] || config['unread'];

  return (
    <span style={{
      padding: '6px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: style.bg,
      color: style.color,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor', opacity: 0.7 }}></span>
      {style.label}
    </span>
  );
};

function Tiket({ initialStatus = 'semua' }) {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Gunakan initialStatus dari props
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const statusOptions = [
    { value: 'semua', label: 'Semua Status' },
    { value: 'unread', label: 'Belum Dibaca' },
    { value: 'read', label: 'Sudah Dibaca' },
    { value: 'in_progress', label: 'Diproses' },
    { value: 'resolved', label: 'Selesai' },
    { value: 'rejected', label: 'Ditolak' }
  ];

  // Update selectedStatus jika initialStatus prop berubah
  useEffect(() => {
    if (initialStatus) {
      setSelectedStatus(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    fetchTickets();
    fetchCategories();
  }, [selectedStatus]);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/api/categories?page=1&limit=100');
      if (response.data.success) setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let url = `/api/tickets?page=1&limit=1000`;
      if (selectedStatus !== 'semua') {
        url += `&status=${selectedStatus}`;
      }

      const response = await axiosInstance.get(url);

      if (response.data.success) setTickets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (ticketId) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    setSelectedTicket(null);
    try {
      const response = await axiosInstance.get(`/api/tickets/${ticketId}`);
      if (response.data.success) setSelectedTicket(response.data.data);
    } catch (error) {
      console.error('Error fetching ticket detail:', error);
      alert('Gagal memuat detail tiket');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setSelectedTicket(null);
    setShowFormModal(true);
  };

  const handleEdit = async (ticketId) => {
    try {
      const response = await axiosInstance.get(`/api/tickets/${ticketId}`);
      if (response.data.success) {
        setIsEditMode(true);
        setSelectedTicket(response.data.data);
        setShowFormModal(true);
      }
    } catch (error) {
      console.error('Error fetching ticket for edit:', error);
    }
  };

  const handleSaveSuccess = () => {
    alert(isEditMode ? 'Tiket berhasil diperbarui!' : 'Tiket berhasil dibuat!');
    closeFormModal();
    fetchTickets();
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tiket ini?')) return;
    try {
      const response = await axiosInstance.delete(`/api/tickets/${ticketId}`);
      if (response.data.success) {
        alert('Tiket berhasil dihapus!');
        fetchTickets();
      } else {
        alert(response.data.message || 'Gagal menghapus tiket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Terjadi kesalahan saat menghapus tiket');
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTicket(null);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setSelectedTicket(null);
    setIsEditMode(false);
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStats = () => ({
    total: tickets.length,
    unread: tickets.filter(t => t.status === 'unread').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  });
  const stats = getStats();

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Tiket Layanan</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Kelola tiket layanan dan bantuan</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Tiket</h3>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Belum Dibaca</h3>
          <div className="stat-value" style={{ color: '#dc2626' }}>{stats.unread}</div>
        </div>
        <div className="stat-card">
          <h3>Diproses</h3>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{stats.in_progress}</div>
        </div>
        <div className="stat-card">
          <h3>Selesai</h3>
          <div className="stat-value" style={{ color: '#10b981' }}>{stats.resolved}</div>
        </div>
      </div>

      <div className="page-container">
        <div className="page-header-content">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Cari tiket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1, minWidth: '250px', padding: '10px 12px',
                border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px'
              }}
            />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '10px 12px', border: '1px solid #d1d5db',
                borderRadius: '8px', fontSize: '14px', minWidth: '180px'
              }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={handleAddNew}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>+</span> Buat Tiket
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Detail Tiket</th>
                <th>Kategori</th>
                <th>Pengguna</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Memuat data...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Tidak ada tiket ditemukan</td></tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <span style={{ color: '#6B7280', fontWeight: '600' }}>#{ticket.id}</span>
                    </td>
                    <td>
                      <strong>{ticket.title}</strong>
                      <div className="sub-text" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ticket.description}
                      </div>
                      {ticket.documents?.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px' }}>
                          📎 {ticket.documents.length} lampiran
                        </div>
                      )}
                    </td>
                    <td>
                      {ticket.category ? (
                        <span style={{ padding: '4px 8px', background: '#F3F4F6', borderRadius: '4px', fontSize: '12px' }}>
                          {ticket.category.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {ticket.user ? (
                        <div>
                          <div style={{ fontWeight: '600' }}>{ticket.user.name}</div>
                          <div className="sub-text">{ticket.user.telp || '-'}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td style={{ color: '#6B7280' }}>
                      {formatDate(ticket.created_at)}
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-action-icon btn-view" onClick={() => handleViewDetail(ticket.id)} title="Lihat">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button className="btn-action-icon btn-edit" onClick={() => handleEdit(ticket.id)} title="Edit">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button className="btn-action-icon btn-delete" onClick={() => handleDelete(ticket.id)} title="Hapus">
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
      </div>

      <FormTiketModal
        show={showFormModal}
        onClose={closeFormModal}
        onSaveSuccess={handleSaveSuccess}
        isEditMode={isEditMode}
        ticketData={selectedTicket}
        categories={categories}
      />

      <DetailTiketModal
        show={showDetailModal}
        onClose={closeDetailModal}
        loading={loadingDetail}
        ticket={selectedTicket}
        formatDate={formatDate}
        getStatusBadge={(status) => status}
      />
    </div>
  );
}

export default Tiket;