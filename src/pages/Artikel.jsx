import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import API_BASE_URL from '../config';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';

const QuillEditor = ({ value, onChange, modules, formats, placeholder, style }) => {
  const { quill, quillRef } = useQuill({ theme: 'snow', modules, formats, placeholder });
  useEffect(() => {
    if (quill && value !== quill.root.innerHTML) {
      if (value === '' && quill.root.innerHTML === '<p><br></p>') return;
      quill.clipboard.dangerouslyPasteHTML(value || '');
    }
  }, [quill, value]);
  useEffect(() => {
    if (!quill) return;
    const handleChange = (delta, oldDelta, source) => {
      if (source === 'user') onChange(quill.root.innerHTML);
    };
    quill.on('text-change', handleChange);
    return () => quill.off('text-change', handleChange);
  }, [quill, onChange]);
  return <div style={style}><div ref={quillRef} /></div>;
};

function Artikel() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [selectedStatus, setSelectedStatus] = useState('semua');

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [formData, setFormData] = useState({ title: '', content: '', category_id: null, feature_image: '', is_published: false });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'image'], ['clean']
    ]
  };
  const formats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link', 'image'];

  useEffect(() => {
    fetchArticles(); fetchCategories();
  }, [selectedCategory, selectedStatus]);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/api/categories');
      if (response.data.success) setCategories(response.data.data || []);
    } catch (error) { console.error(error); }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      let url = `/api/articles?page=1&limit=1000`;
      if (selectedStatus !== 'semua') url += `&published=${selectedStatus === 'published'}`;
      const response = await axiosInstance.get(url);
      if (response.data.success) setArticles(response.data.data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} melebihi 10MB`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`Tipe file ${file.name} bukan gambar yang didukung`);
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenModal = (article = null) => {
    setSelectedFiles([]);
    if (article) {
      setEditingArticle(article);
      setFormData({
        title: article.title, content: article.content,
        category_id: article.category_id || null, feature_image: article.feature_image || '',
        is_published: article.is_published
      });
    } else {
      setEditingArticle(null);
      setFormData({ title: '', content: '', category_id: null, feature_image: '', is_published: false });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticle(null);
    setSelectedFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      let response;
      const url = editingArticle ? `/api/articles/${editingArticle.id}` : `/api/articles`;

      if (editingArticle) {
        response = await axiosInstance.put(url, formData);
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('content', formData.content);
        if (formData.category_id) formDataToSend.append('category_id', formData.category_id);
        formDataToSend.append('is_published', formData.is_published);

        selectedFiles.forEach(file => {
          formDataToSend.append('documents', file);
        });

        response = await axiosInstance.post(url, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert('Berhasil menyimpan artikel!');
      handleCloseModal();
      fetchArticles();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus artikel ini?')) return;
    try {
      await axiosInstance.delete(`/api/articles/${id}`);
      fetchArticles();
    } catch (error) { alert(error.message); }
  };

  const handleViewDetail = async (id) => {
    setShowDetailModal(true); setLoadingDetail(true);
    try {
      const response = await axiosInstance.get(`/api/articles/${id}`);
      if (response.data.success) setSelectedArticle(response.data.data);
    } catch (e) { console.error(e); } finally { setLoadingDetail(false); }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'semua' || (article.category_id && article.category_id.toString() === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const formatDate = (str) => str ? new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const stripHtml = (html) => { const tmp = document.createElement('DIV'); tmp.innerHTML = html; return tmp.textContent || ''; };

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.is_published).length,
    draft: articles.filter(a => !a.is_published).length
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Artikel</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Kelola konten dan berita</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><h3>Total</h3><div className="stat-value">{stats.total}</div></div>
        <div className="stat-card"><h3>Published</h3><div className="stat-value" style={{ color: '#10b981' }}>{stats.published}</div></div>
        <div className="stat-card"><h3>Draft</h3><div className="stat-value" style={{ color: '#6b7280' }}>{stats.draft}</div></div>
      </div>

      <div className="page-container">
        <div className="page-header-content">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text" placeholder="Cari artikel..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
              <option value="semua">Semua Kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-primary" onClick={() => handleOpenModal()}>+ Buat Artikel</button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Kategori</th>
                <th>Penulis</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr> :
                filteredArticles.map(article => (
                  <tr key={article.id}>
                    <td>
                      <strong>{article.title}</strong>
                      <div className="sub-text">{stripHtml(article.content).substring(0, 60)}...</div>
                    </td>
                    <td>
                      {article.category ? <span style={{ fontSize: '12px', padding: '4px 8px', background: article.category.color + '20', color: article.category.color, borderRadius: '4px' }}>{article.category.name}</span> : '-'}
                    </td>
                    <td>{article.user?.name || '-'}</td>
                    <td>
                      <span style={{
                        padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                        background: article.is_published ? '#d1fae5' : '#f3f4f6',
                        color: article.is_published ? '#065f46' : '#374151'
                      }}>
                        {article.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280' }}>{formatDate(article.created_at)}</td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="btn-action-icon btn-view" onClick={() => handleViewDetail(article.id)}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                        <button className="btn-action-icon btn-edit" onClick={() => handleOpenModal(article)}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button className="btn-action-icon btn-delete" onClick={() => handleDelete(article.id)}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header"><h2>{editingArticle ? 'Edit Artikel' : 'Artikel Baru'}</h2><button className="modal-close" onClick={handleCloseModal}>×</button></div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Judul <span style={{ color: 'red' }}>*</span></label><input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>

                <div className="form-group">
                  <label>Kategori</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null })}
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}><label>Isi Artikel</label><QuillEditor value={formData.content} onChange={v => setFormData({ ...formData, content: v })} modules={modules} formats={formats} style={{ height: '300px' }} /></div>

                {!editingArticle && (
                  <div className="form-group" style={{ marginTop: '60px' }}>
                    <label>Lampiran Gambar (Opsional)</label>
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
                      onClick={() => document.getElementById('articleFileInput').click()}>
                      <input id="articleFileInput" type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
                      <div style={{ fontSize: '40px', marginBottom: '8px' }}>📎</div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        Klik atau drag & drop gambar di sini
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                        (Maks. 10MB per file. Hanya JPG, PNG, GIF, WEBP)
                      </p>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Gambar terpilih ({selectedFiles.length}):
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedFiles.map((file, index) => (
                            <div key={index} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '13px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                                <span>📎</span>
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
                )}

                <div style={{ marginTop: '20px' }}><label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}><input type="checkbox" checked={formData.is_published} onChange={e => setFormData({ ...formData, is_published: e.target.checked })} /> Langsung Publikasikan?</label></div>
                <div className="modal-footer"><button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>Batal</button><button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedArticle && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h1 style={{ margin: 0 }}>{selectedArticle.title}</h1>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div style={{ marginBottom: '20px', color: '#6b7280', fontSize: '14px' }}>
              By {selectedArticle.user?.name} | {formatDate(selectedArticle.created_at)}
            </div>
            {selectedArticle.documents && selectedArticle.documents.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <strong>Lampiran:</strong>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {selectedArticle.documents.map(doc => (
                    <a key={doc.id} href={`${API_BASE_URL}/api/files/${doc.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#2563eb', fontSize: '14px' }}>
                      📎 {doc.file_name}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} className="article-content" />
          </div>
        </div>
      )}
    </div>
  );
}
export default Artikel;