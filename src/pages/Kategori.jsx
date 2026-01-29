import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

function Kategori() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3B82F6', icon: 'circle', is_active: true });

  const iconOptions = [
    { value: 'book', emoji: '📚' }, { value: 'heart', emoji: '❤️' },
    { value: 'chart', emoji: '📊' }, { value: 'mosque', emoji: '🕌' },
    { value: 'circle', emoji: '⭕' }, { value: 'star', emoji: '⭐' },
    { value: 'flag', emoji: '🚩' }, { value: 'tag', emoji: '🏷️' }
  ];

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/categories');
      if (response.data.success) setCategories(response.data.data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setFormData(category ? { ...category } : { name: '', description: '', color: '#3B82F6', icon: 'circle', is_active: true });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : `/api/categories`;
      const method = editingCategory ? 'put' : 'post';
      await axiosInstance[method](url, formData);
      alert('Berhasil!'); setShowModal(false); fetchCategories();
    } catch (error) { alert(error.message); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus kategori ini?')) {
      await axiosInstance.delete(`/api/categories/${id}`);
      fetchCategories();
    }
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Kategori</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Manajemen kategori tiket dan artikel</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><h3>Total</h3><div className="stat-value">{categories.length}</div></div>
        <div className="stat-card"><h3>Aktif</h3><div className="stat-value" style={{ color: '#10b981' }}>{categories.filter(c => c.is_active).length}</div></div>
      </div>

      <div className="page-container">
        <div className="page-header-content">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input type="text" placeholder="Cari kategori..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            <button className="btn-primary" onClick={() => handleOpenModal()}>+ Tambah</button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Icon</th>
                <th>Nama</th>
                <th>Warna</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr> :
                filtered.map(cat => (
                  <tr key={cat.id}>
                    <td style={{ textAlign: 'center', fontSize: '20px' }}>
                      {iconOptions.find(i => i.value === cat.icon)?.emoji || '⭕'}
                    </td>
                    <td>
                      <strong>{cat.name}</strong>
                      <div className="sub-text">{cat.description || '-'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: cat.color }}></div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{cat.color}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                        background: cat.is_active ? '#d1fae5' : '#fee2e2',
                        color: cat.is_active ? '#065f46' : '#991b1b'
                      }}>
                        {cat.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-action-icon btn-edit" onClick={() => handleOpenModal(cat)}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button className="btn-action-icon btn-delete" onClick={() => handleDelete(cat.id)}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Component inline or import */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header"><h3>{editingCategory ? 'Edit' : 'Tambah'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Nama</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="form-group"><label>Warna</label><input type="color" style={{ width: '100%', height: '40px' }} value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} /></div>
                <div className="form-group"><label>Icon</label><select value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}>{iconOptions.map(i => <option key={i.value} value={i.value}>{i.emoji} {i.value}</option>)}</select></div>
                <div style={{ marginTop: '20px' }}><label><input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} /> Aktif</label></div>
                <div className="modal-footer"><button type="submit" className="btn-primary">Simpan</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Kategori;