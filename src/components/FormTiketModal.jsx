import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import API_BASE_URL from '../config';

const editStatusOptions = [
  { value: 'unread', label: 'Belum Dibaca' },
  { value: 'read', label: 'Sudah Dibaca' },
  { value: 'in_progress', label: 'Diproses' },
  { value: 'resolved', label: 'Selesai' },
  { value: 'rejected', label: 'Ditolak' }
];

function FormTiketModal({ show, onClose, onSaveSuccess, isEditMode, ticketData, categories }) {

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: null,
    status: 'unread',
    resolution: ''
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (show) {
      if (isEditMode && ticketData) {
        setFormData({
          title: ticketData.title || '',
          description: ticketData.description || '',
          category_id: ticketData.category_id,
          status: ticketData.status || 'unread',
          resolution: ticketData.resolution || ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          category_id: null,
          status: 'unread',
          resolution: ''
        });
        setSelectedFiles([]);
      }
    }
  }, [show, isEditMode, ticketData]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} melebihi 10MB`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`Tipe file ${file.name} tidak diizinkan`);
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (isEditMode && ticketData) {
        const response = await axiosInstance.put(`/api/tickets/${ticketData.id}`, {
          status: formData.status,
          resolution: formData.resolution || null
        });
        if (!response.data.success) throw new Error(response.data.message || 'Gagal update');
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        if (formData.category_id) {
          formDataToSend.append('category_id', formData.category_id);
        }
        selectedFiles.forEach(file => {
          formDataToSend.append('documents', file);
        });

        const response = await axiosInstance.post('/api/tickets', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (!response.data.success) throw new Error(response.data.message || 'Gagal membuat tiket');
      }
      onSaveSuccess();
    } catch (error) {
      alert('Terjadi kesalahan: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? '✏️ Edit Tiket' : '➕ Tambah Tiket Baru'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleFormSubmit} id="ticketForm">
          <div className="modal-body">
            {isEditMode ? (
              <>
                <div className="form-group">
                  <label>Status <span className="required-star">*</span></label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    {editStatusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Catatan</label>
                  <textarea
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    placeholder="Masukkan catatan atau tindak lanjut..."
                    rows="4"
                  />
                </div>

                <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', fontSize: '13px', color: '#92400e', border: '1px solid #fbbf24' }}>
                  ℹ️ Untuk admin: Anda hanya dapat mengubah status dan menambahkan catatan.
                </div>
              </>
            ) : (
              <div className="form-grid">
                <div className="form-group">
                  <label>Judul Tiket <span className="required-star">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul tiket"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Deskripsi <span className="required-star">*</span></label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan masalah atau permintaan Anda secara detail..."
                    rows="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Kategori</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Lampiran Dokumen (Opsional)</label>
                  <div style={{
                    border: '2px dashed #d1d5db', borderRadius: '8px', padding: '20px',
                    textAlign: 'center', background: '#f9fafb', cursor: 'pointer', transition: 'all 0.3s'
                  }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; }}
                    onDrop={(e) => {
                      e.preventDefault(); e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb';
                      handleFileChange({ target: { files: Array.from(e.dataTransfer.files) } });
                    }}
                    onClick={() => document.getElementById('fileInput').click()}>
                    <input id="fileInput" type="file" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📎</div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      Klik atau drag & drop file di sini
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                      (Maks. 10MB per file)
                    </p>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        File terpilih ({selectedFiles.length}):
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedFiles.map((file, index) => (
                          <div key={index} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '13px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                              <span>📄</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{file.name}</span>
                              <span style={{ color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatFileSize(file.size)}</span>
                            </div>
                            <button type="button" onClick={() => removeFile(index)} style={{
                              background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px',
                              padding: '4px 8px', cursor: 'pointer', fontSize: '12px', marginLeft: '8px'
                            }}>
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={uploading}>
              Batal
            </button>
            <button type="submit" className="btn-primary" disabled={uploading} form="ticketForm">
              {uploading ? 'Menyimpan...' : (isEditMode ? '💾 Simpan' : '➕ Buat Tiket')}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default FormTiketModal;