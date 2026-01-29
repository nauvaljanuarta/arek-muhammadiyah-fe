import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const jobOptions = [
  { value: 'Belum / Tidak Bekerja', label: 'Belum / Tidak Bekerja' },
  { value: 'Mengurus Rumah Tangga', label: 'Mengurus Rumah Tangga' },
  { value: 'Pelajar / Mahasiswa', label: 'Pelajar / Mahasiswa' },
  { value: 'Pensiunan', label: 'Pensiunan' },
  { value: 'Pegawai Negeri Sipil (PNS) / ASN', label: 'Pegawai Negeri Sipil (PNS) / ASN' },
  { value: 'TNI / POLRI', label: 'TNI / POLRI' },
  { value: 'Karyawan Swasta', label: 'Karyawan Swasta' },
  { value: 'Karyawan BUMN / BUMD', label: 'Karyawan BUMN / BUMD' },
  { value: 'Wiraswasta', label: 'Wiraswasta' },
  { value: 'Lainnya', label: 'Profesi Lainnya' }
];

const UserEditModal = ({ isOpen, onClose, user, cities, districts, villages, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '', birth_date: '', telp: '', gender: 'male',
    job: '', job_other: '', village_id: '', nik: '', address: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredVillages, setFilteredVillages] = useState([]);

  // State untuk reset password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      let birthDateValue = user.birth_date ? new Date(user.birth_date).toISOString().split('T')[0] : '';
      const isCustomJob = user.job && !jobOptions.find(opt => opt.value === user.job);

      setFormData({
        name: user.name || '',
        birth_date: birthDateValue,
        telp: user.telp || '',
        gender: user.gender || 'male',
        job: isCustomJob ? 'Lainnya' : (user.job || ''),
        job_other: isCustomJob ? user.job : '',
        village_id: user.village_id || '',
        nik: user.nik || '',
        address: user.address || ''
      });

      setSelectedCity(user.city_id || '');
      setSelectedDistrict(user.district_id || '');
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (selectedCity) {
      setFilteredDistricts(districts.filter(d => d.city_id === selectedCity));
    } else {
      setFilteredDistricts([]);
    }
  }, [selectedCity, districts]);

  useEffect(() => {
    if (selectedDistrict) {
      setFilteredVillages(villages.filter(v => v.district_id === selectedDistrict));
    } else {
      setFilteredVillages([]);
    }
  }, [selectedDistrict, villages]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    setSelectedDistrict('');
    setFormData(prev => ({ ...prev, village_id: '' }));
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    setFormData(prev => ({ ...prev, village_id: '' }));
  };

  const handleJobChange = (e) => {
    const job = e.target.value;
    setFormData(prev => ({ ...prev, job: job, job_other: job === 'Lainnya' ? prev.job_other : '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Nama lengkap wajib diisi';
    if (!formData.birth_date) errors.birth_date = 'Tanggal lahir wajib diisi';
    if (!formData.telp.trim() || !/^[0-9]{10,15}$/.test(formData.telp.trim())) errors.telp = 'No. telepon harus 10-15 digit';
    if (!formData.job) errors.job = 'Pekerjaan wajib dipilih';
    if (formData.job === 'Lainnya' && !formData.job_other.trim()) errors.job_other = 'Harap sebutkan profesi';
    if (!selectedCity) errors.city = 'Kabupaten/Kota wajib dipilih';
    if (!selectedDistrict) errors.district = 'Kecamatan wajib dipilih';
    if (!formData.village_id) errors.village_id = 'Kelurahan/Desa wajib dipilih';
    if (!formData.nik.trim() || !/^[0-9]{16}$/.test(formData.nik.trim())) errors.nik = 'NIK harus 16 digit';
    if (!formData.address.trim()) errors.address = 'Alamat wajib diisi';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const finalJob = formData.job === 'Lainnya' ? formData.job_other : formData.job;
      const payload = {
        name: formData.name.trim(),
        birth_date: formData.birth_date + 'T00:00:00Z',
        telp: formData.telp.trim(),
        gender: formData.gender,
        job: finalJob || null,
        village_id: formData.village_id,
        nik: formData.nik.trim(),
        address: formData.address.trim()
      };

      await onSuccess(user.id, payload);

    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      alert('Password baru wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await axiosInstance.post(`/api/users/${user.id}/reset-password`, {
        new_password: newPassword
      });
      if (response.data.success) {
        alert('Password berhasil di-update! User akan diminta ganti password saat login.');
        setShowPasswordModal(false);
        setNewPassword('');
      }
    } catch (error) {
      alert('Gagal reset password: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Data Anggota</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} id="editUserForm">
            <div className="form-grid">

              <div className="form-group">
                <label>Nama Lengkap <span className="required-star">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={formErrors.name ? 'has-error' : ''} />
                {formErrors.name && <span className="form-error-text">{formErrors.name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Jenis Kelamin <span className="required-star">*</span></label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tanggal Lahir <span className="required-star">*</span></label>
                  <input type="date" name="birth_date" value={formData.birth_date} onChange={handleInputChange} className={formErrors.birth_date ? 'has-error' : ''} />
                  {formErrors.birth_date && <span className="form-error-text">{formErrors.birth_date}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>No. Telepon <span className="required-star">*</span></label>
                <input type="text" name="telp" value={formData.telp} onChange={handleInputChange} className={formErrors.telp ? 'has-error' : ''} />
                {formErrors.telp && <span className="form-error-text">{formErrors.telp}</span>}
              </div>

              <div className="form-group">
                <label>Pekerjaan <span className="required-star">*</span></label>
                <select name="job" value={formData.job} onChange={handleJobChange} className={formErrors.job ? 'has-error' : ''}>
                  <option value="">Pilih Pekerjaan</option>
                  {jobOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {formErrors.job && <span className="form-error-text">{formErrors.job}</span>}
              </div>

              {formData.job === 'Lainnya' && (
                <div className="form-group">
                  <label>Sebutkan Profesi <span className="required-star">*</span></label>
                  <input type="text" name="job_other" value={formData.job_other} onChange={handleInputChange} className={formErrors.job_other ? 'has-error' : ''} />
                  {formErrors.job_other && <span className="form-error-text">{formErrors.job_other}</span>}
                </div>
              )}

              <div className="form-group">
                <label>NIK (16 digit) <span className="required-star">*</span></label>
                <input type="text" name="nik" value={formData.nik} onChange={handleInputChange} maxLength="16" className={formErrors.nik ? 'has-error' : ''} />
                {formErrors.nik && <span className="form-error-text">{formErrors.nik}</span>}
              </div>

              <div className="form-section-boxed">
                <h4>📍 Wilayah Domisili</h4>
                <div className="form-group">
                  <label>Kabupaten/Kota <span className="required-star">*</span></label>
                  <select value={selectedCity} onChange={handleCityChange} className={formErrors.city ? 'has-error' : ''}>
                    <option value="">Pilih Kabupaten/Kota</option>
                    {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </select>
                  {formErrors.city && <span className="form-error-text">{formErrors.city}</span>}
                </div>
                <div className="form-group">
                  <label>Kecamatan <span className="required-star">*</span></label>
                  <select value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedCity} className={formErrors.district ? 'has-error' : ''}>
                    <option value="">Pilih Kecamatan</option>
                    {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {formErrors.district && <span className="form-error-text">{formErrors.district}</span>}
                </div>
                <div className="form-group">
                  <label>Kelurahan/Desa <span className="required-star">*</span></label>
                  <select name="village_id" value={formData.village_id} onChange={handleInputChange} disabled={!selectedDistrict} className={formErrors.village_id ? 'has-error' : ''}>
                    <option value="">Pilih Kelurahan/Desa</option>
                    {filteredVillages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  {formErrors.village_id && <span className="form-error-text">{formErrors.village_id}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Alamat Lengkap <span className="required-star">*</span></label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className={formErrors.address ? 'has-error' : ''}></textarea>
                {formErrors.address && <span className="form-error-text">{formErrors.address}</span>}
              </div>

            </div>
          </form>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            disabled={isSubmitting}
            style={{
              padding: '10px 16px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Edit Password
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              form="editUserForm"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Reset Password */}
      {showPasswordModal && (
        <div className="modal-overlay" style={{ zIndex: 1001 }} onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#374151' }}>
                Reset password untuk: <strong>{user.name}</strong>
              </p>
              <div className="form-group">
                <label>Password Baru <span className="required-star">*</span></label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru (min. 6 karakter)"
                  autoFocus
                />
              </div>
              {/* <div style={{
                padding: '12px',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#92400e',
                marginTop: '16px'
              }}>
                ⚠️ User akan diminta mengganti password saat login berikutnya.
              </div> */}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShowPasswordModal(false); setNewPassword(''); }}
                disabled={isResettingPassword}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleResetPassword}
                disabled={isResettingPassword || !newPassword.trim()}
              >
                {isResettingPassword ? 'Menyimpan...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserEditModal;