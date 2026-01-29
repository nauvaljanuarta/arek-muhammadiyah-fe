# Rangkuman Perubahan Reset Password

> **Context:** Dokumentasi untuk penyesuaian frontend web admin panel.

---

## 📁 File Backend yang Diubah

| File | Perubahan |
|------|-----------|
| `app/model/request.go` | Tambah struct `ForgotPasswordRequest` |
| `app/model/user.go` | Tambah field `ForceChangePassword` |
| `app/repository/user_repository.go` | Tambah fungsi `GetByPersonalData()` |
| `app/service/auth_service.go` | Tambah handler `ForgotPasswordResetDefault()` |
| `app/service/user_service.go` | **Tambah handler `ResetPassword()` (ADMIN)** |
| `route/auth_routes.go` | Tambah route `POST /api/auth/forgot` |
| `route/user_routes.go` | **Tambah route `POST /api/users/:id/reset-password` (ADMIN)** |

---

## 🔌 Endpoint untuk Admin Panel (Custom Password)

```http
POST /api/users/:id/reset-password
Authorization: Bearer <access_token>
Content-Type: application/json
```

> **Catatan:** Endpoint ini memerlukan role **Admin** untuk mengakses.

### Request Body
```json
{
  "new_password": "passwordBaruUser123"
}
```

### Response Sukses
```json
{
  "success": true,
  "message": "Password berhasil di-update",
  "data": {
    "user_id": 123,
    "user_name": "Nama User"
  }
}
```

### Response Gagal
```json
{
  "success": false,
  "message": "new_password is required"
}
```

---

## 🔌 Endpoint untuk Mobile Client (Partner - Reset Default)

```http
POST /api/auth/forgot
```

### Request Body
```json
{
  "name": "Nama Lengkap User",
  "birth_date": "1990-01-15",
  "nik": "3576012345678901",
  "telp": "081234567890"
}
```

Password akan di-reset ke default: `password123`

---

## 🔐 Perbandingan Endpoint

| Endpoint | Untuk | Verifikasi | Password |
|----------|-------|------------|----------|
| `POST /api/users/:id/reset-password` | Admin Panel | Admin only | **Custom (dari request)** |
| `POST /api/auth/forgot` | Mobile Client | Data pribadi | Default (`password123`) |

**Hasil Reset:**
- Field `force_change_password` di-set `true`
- User wajib ganti password saat login pertama

---

## 📝 Penyesuaian Frontend Web Admin Panel

### 1. Form Reset Password di Halaman Detail User

```javascript
const resetUserPassword = async (userId, newPassword) => {
  try {
    const response = await api.post(`/api/users/${userId}/reset-password`, {
      new_password: newPassword
    });
    
    if (response.data.success) {
      toast.success('Password berhasil di-update');
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Gagal reset password');
  }
};
```

### 2. Modal/Dialog Reset Password

```jsx
<Dialog>
  <DialogTitle>Reset Password User</DialogTitle>
  <DialogContent>
    <TextField
      label="Password Baru"
      type="password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => resetUserPassword(userId, newPassword)}>
      Reset Password
    </Button>
  </DialogActions>
</Dialog>
```

### 3. Handle `force_change_password` saat Login

```javascript
if (user.force_change_password) {
  router.push('/change-password');
}
```

---

## ⚠️ Catatan Penting

- Admin bisa set password custom untuk user
- Endpoint memerlukan middleware `AdminOnly()`
- Setelah reset, `force_change_password = true` (user wajib ganti password)
