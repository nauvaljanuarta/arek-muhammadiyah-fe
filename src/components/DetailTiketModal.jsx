import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import API_BASE_URL from '../config';

function DetailTiketModal({ show, onClose, loading, ticket, formatDate, getStatusBadge }) {
  const [deletingFileId, setDeletingFileId] = useState(null);

  if (!show) {
    return null;
  }

  const handleDownloadFile = (fileId, fileName) => {
    const url = `${API_BASE_URL}/api/files/${fileId}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (ticketId, fileId, fileName) => {
    if (!window.confirm(`Hapus file "${fileName}"?`)) return;
    setDeletingFileId(fileId);
    try {
      const response = await axiosInstance.delete(`/api/tickets/${ticketId}/files/${fileId}`);
      if (response.data.success) {
        alert('File berhasil dihapus!');
        window.location.reload(); // Ganti dengan callback refresh jika ada
      } else {
        alert(response.data.message || 'Gagal menghapus file');
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletingFileId(null);
    }
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
    return '📄';
  };

  // Helper untuk baris info
  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ color: '#6b7280', fontSize: '14px' }}>{label}</span>
      <strong style={{ fontSize: '14px', textAlign: 'right' }}>{value || '-'}</strong>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detail Tiket</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Memuat data...</div>
          ) : !ticket ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Data tidak ditemukan</div>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{ticket.title}</h3>
                  <code style={{ background: '#e5e7eb', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    #{ticket.id}
                  </code>
                </div>
                {getStatusBadge(ticket.status)}
              </div>

              {ticket.user && (
                <div>
                  <h4 className="form-section-boxed" style={{ background: 'transparent', padding: 0, border: 0, borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
                    Informasi Pengguna
                  </h4>
                  <InfoRow label="Nama" value={ticket.user.name} />
                  <InfoRow label="No. Telepon" value={ticket.user.telp} />
                  <InfoRow label="Wilayah" value={ticket.user.city_name} />
                </div>
              )}

              {ticket.category && (
                <div>
                  <h4 className="form-section-boxed" style={{ background: 'transparent', padding: 0, border: 0, borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
                    Kategori
                  </h4>
                  <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', borderLeft: `4px solid ${ticket.category.color || '#3b82f6'}` }}>
                    <strong>{ticket.category.name}</strong>
                    {ticket.category.description && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                        {ticket.category.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h4 className="form-section-boxed" style={{ background: 'transparent', padding: 0, border: 0, borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
                  Deskripsi Masalah
                </h4>
                <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </div>
              </div>

              {ticket.resolution && (
                <div>
                  <h4 className="form-section-boxed" style={{ background: 'transparent', padding: 0, border: 0, borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
                    Catatan
                  </h4>
                  <div style={{ padding: '12px', background: '#d1fae5', borderRadius: '6px', fontSize: '14px', lineHeight: '1.6', border: '1px solid #059669' }}>
                    {ticket.resolution}
                  </div>
                </div>
              )}

              {ticket.documents && ticket.documents.length > 0 && (
                <div>
                  <h4 className="form-section-boxed" style={{ background: 'transparent', padding: 0, border: 0, borderBottom: '2px solid #e5e7eb', paddingBottom: '8px', marginBottom: '12px' }}>
                    Dokumen Lampiran ({ticket.documents.length})
                  </h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {ticket.documents.map((doc) => (
                      <div key={doc.id} style={{
                        padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{getFileIcon(doc.mime_type)}</span>
                          <div>
                            <strong style={{ fontSize: '14px' }}>{doc.file_name}</strong>
                            {doc.file_size && <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>({(doc.file_size / 1024).toFixed(2)} KB)</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                          <button onClick={() => handleDownloadFile(doc.id, doc.file_name)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            ⬇️ Download
                          </button>
                          <button onClick={() => handleDeleteFile(ticket.id, doc.id, doc.file_name)} disabled={deletingFileId === doc.id}
                            className="btn-secondary btn-delete" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            {deletingFileId === doc.id ? '...' : '🗑️ Hapus'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
                <InfoRow label="Dibuat" value={formatDate(ticket.created_at)} />
                <InfoRow label="Diubah" value={formatDate(ticket.updated_at)} />
                {ticket.resolved_at && <InfoRow label="Selesai" value={formatDate(ticket.resolved_at)} />}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailTiketModal;