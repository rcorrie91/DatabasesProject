import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>
        <div className="auth-card">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Welcome back! Please login to your account.</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="auth-submit-btn">
              Login
            </button>
            <p className="auth-switch">
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

