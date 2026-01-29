# Rangkuman Implementasi Access Token & Refresh Token

## ✅ Perubahan yang Dilakukan

### 1. `config/env.go`
- Ditambahkan field `JWTRefreshSecret` untuk secret key refresh token
- Tambahkan di `.env`: `JWT_REFRESH_SECRET=your_refresh_secret_key_here`

### 2. `helper/utils/jwt.go`
- `GenerateAccessToken()` - access token (1 jam expiry)
- `GenerateRefreshToken()` - refresh token (30 hari expiry)
- `ValidateAccessToken()` - validasi access token
- `ValidateRefreshToken()` - validasi refresh token

### 3. `app/service/auth_service.go`
- Login sekarang return `access_token` dan `refresh_token`
- Ditambahkan handler `RefreshToken()` untuk refresh access token

### 4. `route/auth_routes.go`
- Ditambahkan route: `POST /api/auth/refresh`

---

## 🔧 Penyesuaian Frontend

### 1. Response Login Berubah

**Sebelum:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "token": "eyJhbG..."
  }
}
```

**Sesudah:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG..."
  }
}
```

### 2. Simpan Kedua Token di Frontend

```javascript
const handleLogin = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  
  if (response.data.success) {
    localStorage.setItem('access_token', response.data.data.access_token);
    localStorage.setItem('refresh_token', response.data.data.refresh_token);
  }
};
```

### 3. Gunakan Access Token untuk Request

```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`
}
```

### 4. Endpoint Baru: Refresh Token

**Request:**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbG..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbG..."
  }
}
```

### 5. Implementasi Auto-Refresh di Frontend

```javascript
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/api/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const newAccessToken = response.data.data.access_token;
        localStorage.setItem('access_token', newAccessToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## ⏱️ Token Expiry

| Token Type | Durasi | Kegunaan |
|------------|--------|----------|
| Access Token | 1 jam | Untuk akses API (Authorization header) |
| Refresh Token | 30 hari | Untuk mendapatkan access token baru |

---

## 📝 Checklist Frontend

- [ ] Update handling response login (`token` → `access_token` + `refresh_token`)
- [ ] Simpan `refresh_token` di localStorage/secure storage
- [ ] Implementasi interceptor untuk auto-refresh saat 401
- [ ] Tambahkan logic untuk redirect ke login saat refresh token expired
- [ ] Update logout untuk clear kedua token

---

## 🔐 Environment Variable Baru

Tambahkan di `.env` backend:
```env
JWT_REFRESH_SECRET=buat_secret_key_yang_berbeda_dari_jwt_secret
```

> **PENTING:** Pastikan `JWT_REFRESH_SECRET` **BERBEDA** dari `JWT_SECRET` untuk keamanan.
