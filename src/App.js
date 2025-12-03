import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import ArtistTracker from './components/ArtistTracker';
import ChangePassword from './components/ChangePassword';
import MyArtists from './components/MyArtists';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tracker" element={<ArtistTracker />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/my-artists" element={<MyArtists />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

