import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';

const GeoJSONMap = ({ geoJsonData, cityStatsData, onCityClick, onCityHover, wilayahData }) => {
  const mapRef = useRef();

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [geoJsonData]);

  // Fungsi untuk mendapatkan city_id dari nama kabupaten/kota
  const getCityIdFromName = (cityName) => {
    if (!wilayahData || wilayahData.length === 0) {
      return null;
    }

    const normalizedSearch = cityName.toUpperCase().trim();

    // Cari di wilayahData berdasarkan name
    const found = wilayahData.find(city => {
      const normalizedCityName = city.name.toUpperCase().trim();

      // Exact match
      if (normalizedCityName === normalizedSearch) {
        return true;
      }

      // Partial match
      if (normalizedCityName.includes(normalizedSearch) ||
        normalizedSearch.includes(normalizedCityName)) {
        return true;
      }

      // Handle "KABUPATEN" atau "KOTA" prefix
      const nameWithoutPrefix = normalizedCityName
        .replace('KABUPATEN ', '')
        .replace('KOTA ', '');
      const searchWithoutPrefix = normalizedSearch
        .replace('KABUPATEN ', '')
        .replace('KOTA ', '');

      if (nameWithoutPrefix === searchWithoutPrefix) {
        return true;
      }

      return false;
    });

    return found ? found.id : null;
  };

  // Fungsi untuk mendapatkan warna berdasarkan jumlah anggota
  const getColorByMemberCount = (members) => {
    if (members > 500) return '#800026';
    if (members > 300) return '#BD0026';
    if (members > 200) return '#E31A1C';
    if (members > 100) return '#FC4E2A';
    if (members > 50) return '#FD8D3C';
    if (members > 20) return '#FEB24C';
    if (members > 10) return '#FED976';
    if (members > 0) return '#FFEDA0';
    return '#f3f4f6';
  };

  const style = (feature) => {
    const cityName = feature.properties.WADMKK || feature.properties.NAME || feature.properties.name;
    const cityId = getCityIdFromName(cityName);

    const cityData = cityId && cityStatsData ? cityStatsData[cityId] : null;
    const memberCount = cityData ? cityData.total_users : 0;

    return {
      fillColor: getColorByMemberCount(memberCount),
      weight: 2.5,
      opacity: 1,
      color: '#2563eb',
      fillOpacity: 0.75
    };
  };

  const onEachFeature = (feature, layer) => {
    const cityName = feature.properties.WADMKK || feature.properties.NAME || feature.properties.name;
    const cityId = getCityIdFromName(cityName);
    const cityData = cityId && cityStatsData ? cityStatsData[cityId] : null;

    layer.bindTooltip(cityName, {
      permanent: false,
      direction: 'center',
      className: 'city-tooltip'
    });

    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 4,
          color: '#1e40af',
          dashArray: '',
          fillOpacity: 0.95
        });
        layer.bringToFront();

        if (onCityHover) {
          onCityHover(cityName, cityId, cityData, e);
        }
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(style(feature));
      },
      click: (e) => {
        const map = e.target._map;
        map.fitBounds(e.target.getBounds());

        if (onCityClick) {
          onCityClick(cityName, cityId, cityData);
        }
      }
    });
  };

  // Filter GeoJSON untuk hanya menampilkan Jawa Timur
  const filterJawaTimur = (geoJsonData) => {
    if (!geoJsonData || !geoJsonData.features) return null;

    // Daftar lengkap kabupaten/kota di Jawa Timur
    const jawaTimurCities = [
      // Kabupaten dengan prefix
      'KABUPATEN PACITAN', 'KABUPATEN PONOROGO', 'KABUPATEN TRENGGALEK',
      'KABUPATEN TULUNGAGUNG', 'KABUPATEN BLITAR', 'KABUPATEN KEDIRI',
      'KABUPATEN MALANG', 'KABUPATEN LUMAJANG', 'KABUPATEN JEMBER',
      'KABUPATEN BANYUWANGI', 'KABUPATEN BONDOWOSO', 'KABUPATEN SITUBONDO',
      'KABUPATEN PROBOLINGGO', 'KABUPATEN PASURUAN', 'KABUPATEN SIDOARJO',
      'KABUPATEN MOJOKERTO', 'KABUPATEN JOMBANG', 'KABUPATEN NGANJUK',
      'KABUPATEN MADIUN', 'KABUPATEN MAGETAN', 'KABUPATEN NGAWI',
      'KABUPATEN BOJONEGORO', 'KABUPATEN TUBAN', 'KABUPATEN LAMONGAN',
      'KABUPATEN GRESIK', 'KABUPATEN BANGKALAN', 'KABUPATEN SAMPANG',
      'KABUPATEN PAMEKASAN', 'KABUPATEN SUMENEP',
      // Kota
      'KOTA KEDIRI', 'KOTA BLITAR', 'KOTA MALANG', 'KOTA PROBOLINGGO',
      'KOTA PASURUAN', 'KOTA MOJOKERTO', 'KOTA MADIUN', 'KOTA SURABAYA', 'KOTA BATU',
      // Tanpa prefix (untuk fallback matching)
      'PACITAN', 'PONOROGO', 'TRENGGALEK', 'TULUNGAGUNG', 'BLITAR', 'KEDIRI',
      'MALANG', 'LUMAJANG', 'JEMBER', 'BANYUWANGI', 'BONDOWOSO', 'SITUBONDO',
      'PROBOLINGGO', 'PASURUAN', 'SIDOARJO', 'MOJOKERTO', 'JOMBANG', 'NGANJUK',
      'MADIUN', 'MAGETAN', 'NGAWI', 'BOJONEGORO', 'TUBAN', 'LAMONGAN', 'GRESIK',
      'BANGKALAN', 'SAMPANG', 'PAMEKASAN', 'SUMENEP', 'SURABAYA', 'BATU'
    ];

    const filteredFeatures = geoJsonData.features.filter(feature => {
      // Filter berdasarkan kode provinsi Jawa Timur (35)
      const provinceCode = feature.properties.KDPPUM || feature.properties.KODE || feature.properties.KDPKAB || '';
      if (provinceCode.toString().startsWith('35')) return true;

      // Fallback: filter berdasarkan nama
      const cityName = (feature.properties.WADMKK || feature.properties.NAME || feature.properties.name || '').toUpperCase().trim();

      // Exact match first
      if (jawaTimurCities.includes(cityName)) return true;

      // Partial match
      return jawaTimurCities.some(jatimCity => {
        const normalizedJatim = jatimCity.replace('KABUPATEN ', '').replace('KOTA ', '');
        const normalizedCity = cityName.replace('KABUPATEN ', '').replace('KOTA ', '');
        return normalizedCity === normalizedJatim;
      });
    });

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
  };

  if (!geoJsonData) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div>Loading map...</div>
      </div>
    );
  }

  const filteredGeoJson = filterJawaTimur(geoJsonData);

  if (!filteredGeoJson || filteredGeoJson.features.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div>Data Jawa Timur tidak ditemukan</div>
      </div>
    );
  }

  // --- Komponen Legend ---
  const MapLegend = () => {
    const grades = [0, 10, 20, 50, 100, 200, 300, 500];
    const labels = [];

    // Helper untuk style item legend
    const legendItemStyle = {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '4px',
      fontSize: '11px',
      color: '#374151'
    };

    const colorBoxStyle = (color) => ({
      width: '18px',
      height: '18px',
      backgroundColor: color,
      marginRight: '8px',
      opacity: 0.8,
      border: '1px solid rgba(0,0,0,0.1)'
    });

    return (
      <div className="info legend" style={{
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 0 15px rgba(0,0,0,0.2)',
        borderRadius: '5px',
        lineHeight: '18px',
        color: '#555',
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        minWidth: '120px'
      }}>
        <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 'bold' }}>Jumlah Anggota</h4>
        {grades.map((grade, index) => {
          const nextGrade = grades[index + 1];
          // Menggunakan +1 untuk range bawah karena logikanya 'members > grade'
          // Kecuali 0 yang berarti > 0
          const from = grade === 0 ? 0 : grade + 1;
          const to = nextGrade ? nextGrade : '+';

          // Ambil warna berdasarkan nilai 'from'
          // Kita gunakan 'from' agar sesuai dengan logika if (members > X)
          // Contoh: untuk range 11-20, kita butuh warna untuk >10 yaitu #FED976
          let colorToCheck = from;
          // Koreksi khusus untuk logika > 0 agar mapping warna tepat
          if (grade === 0) colorToCheck = 1;

          return (
            <div key={index} style={legendItemStyle}>
              <i style={colorBoxStyle(getColorByMemberCount(colorToCheck))}></i>
              <span>
                {grade === 0 ? '> 0' :
                  grade === 500 ? '> 500' :
                    `${grade + 1} – ${nextGrade}`}
              </span>
            </div>
          );
        })}
        <div style={legendItemStyle}>
          <i style={colorBoxStyle('#f3f4f6')}></i>
          <span>0 / Tidak ada data</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={[-7.5, 112.5]}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        scrollWheelZoom={true}
        zoomControl={true}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredGeoJson && (
          <GeoJSON
            key={JSON.stringify(cityStatsData)}
            data={filteredGeoJson}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Render Legend di sini */}
      <MapLegend />
    </div>
  );
};

export default GeoJSONMap;