import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import API_BASE_URL from '../config';

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

// Tambahkan prop showCloseButton (default false)
const AddMemberModal = ({ isOpen, onClose, cities, districts, villages, onSuccess, keepOpen = false, showCloseButton = false }) => {
  const initialForm = {
    name: '', birth_date: '', telp: '', gender: 'male',
    job: '', job_other: '', village_id: '', nik: '', address: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredVillages, setFilteredVillages] = useState([]);

  useEffect(() => {
    if (selectedCity) {
      setFilteredDistricts(districts.filter(d => d.city_id === selectedCity));
    } else {
      setFilteredDistricts([]);
    }
    setFilteredVillages([]);
  }, [selectedCity, districts]);

  useEffect(() => {
    if (selectedDistrict) {
      setFilteredVillages(villages.filter(v => v.district_id === selectedDistrict));
    } else {
      setFilteredVillages([]);
    }
  }, [selectedDistrict, villages]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData(initialForm);
    setFormErrors({});
    // Kita tidak reset selectedCity/District agar memudahkan input massal di wilayah yang sama
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    setSelectedDistrict('');
    setFormData(prev => ({ ...prev, village_id: '' }));
    if (formErrors.city) setFormErrors(prev => ({ ...prev, city: '' }));
  };

  const handleDistrictChange = (e) => {
    setSelectedDistrict(e.target.value);
    setFormData(prev => ({ ...prev, village_id: '' }));
    if (formErrors.district) setFormErrors(prev => ({ ...prev, district: '' }));
  };

  const handleJobChange = (e) => {
    const job = e.target.value;
    setFormData(prev => ({ ...prev, job: job, job_other: job === 'Lainnya' ? prev.job_other : '' }));
    if (formErrors.job) setFormErrors(prev => ({ ...prev, job: '' }));
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

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const finalJob = formData.job === 'Lainnya' ? formData.job_other : formData.job;
      const payload = {
        name: formData.name.trim(),
        password: 'password123',
        birth_date: formData.birth_date + 'T00:00:00Z',
        telp: formData.telp.trim(),
        gender: formData.gender,
        job: finalJob || null,
        role_id: 3,
        village_id: formData.village_id,
        nik: formData.nik.trim(),
        address: formData.address.trim(),
        is_mobile: false
      };

      const response = await axiosInstance.post('/api/users', payload);

      if (!response.data.success) throw new Error(response.data.message || 'Gagal menambahkan anggota');

      alert('Anggota berhasil ditambahkan! Password default: password123');

      if (keepOpen) {
        resetForm();
        if (onSuccess) onSuccess();
      } else {
        handleCloseModal();
        if (onSuccess) onSuccess();
      }

    } catch (error) {
      alert('Gagal menambahkan anggota: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(keepOpen && !showCloseButton) ? undefined : handleCloseModal}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h2>Tambah Anggota Baru</h2>
          {/* Tampilkan tombol close jika showCloseButton TRUE atau keepOpen FALSE */}
          {(showCloseButton || !keepOpen) && (
            <button className="modal-close" onClick={handleCloseModal} title="Tutup / Kembali ke Menu">×</button>
          )}
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmitAdd} id="addMemberForm">
            <div className="form-grid">

              <div className="form-group">
                <label>Nama Lengkap <span className="required-star">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Masukkan nama lengkap" className={formErrors.name ? 'has-error' : ''} />
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
                <input type="text" name="telp" value={formData.telp} onChange={handleInputChange} placeholder="081234567890" className={formErrors.telp ? 'has-error' : ''} />
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
                  <input type="text" name="job_other" value={formData.job_other} onChange={handleInputChange} placeholder="Contoh: Freelancer" className={formErrors.job_other ? 'has-error' : ''} />
                  {formErrors.job_other && <span className="form-error-text">{formErrors.job_other}</span>}
                </div>
              )}

              <div className="form-group">
                <label>NIK (16 digit) <span className="required-star">*</span></label>
                <input type="text" name="nik" value={formData.nik} onChange={handleInputChange} placeholder="3507091203000001" maxLength="16" className={formErrors.nik ? 'has-error' : ''} />
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
                <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="Jl. Merdeka No. 45, RT 01/RW 02" rows="3" className={formErrors.address ? 'has-error' : ''}></textarea>
                {formErrors.address && <span className="form-error-text">{formErrors.address}</span>}
              </div>

              <div style={{ padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '13px', color: '#1e40af' }}>
                <strong>ℹ️ Informasi:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Password default: <code>password123</code></li>
                  <li>Role: Member (3)</li>
                  <li>Akses Mobile App: Tidak aktif</li>
                </ul>
              </div>

            </div>
          </form>
        </div>

        <div className="modal-footer">
          {(!keepOpen || showCloseButton) && (
            <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isSubmitting}>
              {keepOpen ? 'Kembali' : 'Batal'}
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            form="addMemberForm"
            style={keepOpen && !showCloseButton ? { width: '100%' } : {}}
          >
            {isSubmitting ? 'Menyimpan...' : (keepOpen ? 'Simpan & Input Lagi' : 'Simpan Anggota')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddMemberModal;