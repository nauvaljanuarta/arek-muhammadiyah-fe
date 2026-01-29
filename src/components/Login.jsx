import React, { useState } from 'react';
import API_BASE_URL from '../config';

function Login({ onLogin }) {
  const [telp, setTelp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telp, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        const { access_token, refresh_token, user } = data.data;
        
        if (access_token && refresh_token) {
           onLogin(access_token, refresh_token, user ? user.role_id : null);
        } else {
           setError('Token tidak ditemukan.');
        }

      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftSide}>
        <div style={styles.imageCard}>
          <img 
            src="/img/people.jpg" 
            alt="Dashboard Illustration" 
            style={styles.image}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </div>

      <div style={styles.rightSide}>
        <div style={styles.formWrapper}>
          <div style={styles.logoContainer}>
            <img 
              src="/img/logoBranding.png" 
              alt="Muhammadiyah Logo" 
              style={styles.logo}
            />
          </div>
            

          <div style={styles.form}>
            <div style={styles.formGroup}>
              <input
                type="tel"
                id="telp"
                value={telp}
                onChange={(e) => setTelp(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter phone number"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Password"
                  style={styles.input}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

           

            {error && <div style={styles.errorMessage}>{error}</div>}

            <button 
              onClick={handleSubmit}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {})
              }} 
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    background: '#f0f0f5',
    padding: '20px',
    boxSizing: 'border-box',
  },
  leftSide: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  imageCard: {
    background: 'linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%)',
    borderRadius: '40px',
    // padding: '60px',
    width: '100%',
    maxWidth: '900px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  },
  image: {
    width: '100%',
    height: 'auto',
    borderRadius: '20px',
    objectFit: 'contain',
  },
  rightSide: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  formWrapper: {
    background: '#f0f0f5',
    padding: '50px 40px',
    width: '100%',
    maxWidth: '450px',
  },
  logoContainer: {
    textAlign: 'center',
    marginBottom: '20px',
    width: '100%',
  },
  logo: {
    width: '100%',
    maxWidth: '360px',
    objectFit: 'contain',
  },
  title: {
    textAlign: 'center',
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#1a1a1a',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '15px',
    color: '#8e8e8e',
    marginBottom: '35px',
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginBottom: '16px',
  },
  passwordWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '16px 20px',
    border: 'none',
    borderRadius: '15px',
    fontSize: '15px',
    background: '#f5f5f5',
    boxSizing: 'border-box',
    color: '#333',
  },
  eyeButton: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '5px',
  },
  errorMessage: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fecaca',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: '16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  buttonDisabled: {
    background: '#93c5fd',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};

export default Login;