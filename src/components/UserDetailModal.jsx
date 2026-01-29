import React from 'react';

const UserDetailModal = ({ isOpen, onClose, user, loading }) => {
  if (!isOpen) return null;

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper untuk render baris info
  const InfoRow = ({ label, value, isCode = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ color: '#6b7280', fontSize: '14px' }}>{label}</span>
      {isCode ? (
        <code style={{ fontSize: '14px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontWeight: '500' }}>
          {value || '-'}
        </code>
      ) : (
        <strong style={{ fontSize: '14px', textAlign: 'right' }}>{value || '-'}</strong>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <h2>Detail Anggota</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Memuat data...
            </div>
          ) : !user ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Data tidak ditemukan
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px' }}>
              
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
                  {user.name}
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {user.is_mobile && (
                    <span className="status-badge badge-green">📱 Pengguna Mobile</span>
                  )}
                  <span className="status-badge badge-gray">
                    {user.gender === 'male' ? '♂️ Laki-laki' : '♀️ Perempuan'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="form-section-boxed" style={{background:'transparent', padding:0, border:0, borderBottom: '2px solid #e5e7eb', paddingBottom:'8px', marginBottom:'12px'}}>
                  Data Pribadi
                </h4>
                <InfoRow label="NIK" value={user.nik} isCode={true} />
                <InfoRow label="Tanggal Lahir" value={formatDate(user.birth_date)} />
                <InfoRow label="Usia" value={user.birth_date ? `${calculateAge(user.birth_date)} tahun` : '-'} />
                <InfoRow label="Pekerjaan" value={user.job} />
              </div>

              <div>
                <h4 className="form-section-boxed" style={{background:'transparent', padding:0, border:0, borderBottom: '2px solid #e5e7eb', paddingBottom:'8px', marginBottom:'12px'}}>
                  Kontak & Wilayah
                </h4>
                <InfoRow label="No. Telepon" value={user.telp} />
                <InfoRow label="Alamat" value={user.address} />
                <InfoRow label="Kelurahan/Desa" value={user.village_name} />
                <InfoRow label="Kecamatan" value={user.district_name} />
                <InfoRow label="Kabupaten/Kota" value={user.city_name} />
              </div>
              
              <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
                {user.created_at && (
                  <InfoRow label="Terdaftar" value={formatDate(user.created_at)} />
                )}
                {user.updated_at && user.updated_at !== user.created_at && (
                  <InfoRow label="Diubah" value={formatDate(user.updated_at)} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ background: 'white' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;