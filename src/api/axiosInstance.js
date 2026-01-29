import axios from 'axios';
import API_BASE_URL from '../config';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor - tambahkan access token ke setiap request
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 & auto-refresh token
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Jika error 401 dan belum pernah retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    // Tidak ada refresh token, redirect ke login
                    localStorage.clear();
                    window.location.href = '/';
                    return Promise.reject(error);
                }

                // Request access token baru menggunakan refresh token
                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                    refresh_token: refreshToken
                });

                if (response.data.success && response.data.data.access_token) {
                    const newAccessToken = response.data.data.access_token;
                    localStorage.setItem('access_token', newAccessToken);

                    // Retry request original dengan token baru
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return axiosInstance(originalRequest);
                } else {
                    throw new Error('Failed to refresh token');
                }
            } catch (refreshError) {
                // Refresh token expired atau invalid, logout user
                console.error('Refresh token failed:', refreshError);
                localStorage.clear();
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
