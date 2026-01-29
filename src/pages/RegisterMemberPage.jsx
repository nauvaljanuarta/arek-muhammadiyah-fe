import React, { useState, useEffect } from 'react';
import AddMemberModal from '../components/AddMemberModal';

function RegisterMemberPage({ onLogout }) {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [viewMode, setViewMode] = useState('menu');

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
          if (city.districts) {
            city.districts.forEach(district => {
              allDistricts.push({ ...district, city_id: city.id, city_name: city.name });
              if (district.villages) {
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

  const handleSuccess = () => {
    console.log("Data saved, ready for next input");
  };

  const handleLogoutClick = () => {
    if (window.confirm("Yakin ingin keluar dari sistem?")) {
      onLogout();
    }
  };

  if (viewMode === 'menu') {
    return (
      <div className="register-page-container" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src="/img/logoBranding.png" alt="Logo" style={{ maxWidth: '300px', marginBottom: '16px' }} />
          <h2 style={{ color: '#374151', margin: 0 }}>Portal Input Anggota</h2>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Silakan pilih menu di bawah ini</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%',
          maxWidth: '800px'
        }}>

          <div
            onClick={() => setViewMode('form')}
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{
              width: '64px', height: '64px',
              background: '#eff6ff', color: '#3b82f6',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px', fontSize: '24px'
            }}>
              ➕
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#111827' }}>Input Anggota Baru</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Buka formulir pendaftaran untuk menambahkan data anggota secara massal.
            </p>
          </div>

          <div
            onClick={handleLogoutClick}
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{
              width: '64px', height: '64px',
              background: '#fef2f2', color: '#ef4444',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px', fontSize: '24px'
            }}>
              🚪
            </div>
            <h3 style={{ margin: '0 0 8px', color: '#111827' }}>Keluar Aplikasi</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Akhiri sesi input data dan kembali ke halaman login.
            </p>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="register-page-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '900px', marginBottom: '10px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setViewMode('menu')}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}
        >
          &larr; Kembali ke Menu Utama
        </button>
      </div>

      <AddMemberModal
        isOpen={true}
        onClose={() => setViewMode('menu')}
        cities={cities}
        districts={districts}
        villages={villages}
        onSuccess={handleSuccess}
        keepOpen={true}
        showCloseButton={true}
      />
    </div>
  );
}

export default RegisterMemberPage;