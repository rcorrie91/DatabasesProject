import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterFields, setFilterFields] = useState({ country: '', city: '', genre: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newArtist, setNewArtist] = useState({ artist: '', rating: '', date: '', city: '', country: '' });
  const ratingOptions = Array.from({ length: 10 }, (_, index) => (index + 1).toString());

  const totalArtists = 0;
  const artistsThisYear = 0;
  const artistImages = [];

  const toggleRating = (value) => {
    setSelectedRatings((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleFilterInput = (e) => {
    const { name, value } = e.target;
    if (name === 'start' || name === 'end') {
      setDateRange((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setFilterFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalInput = (e) => {
    const { name, value } = e.target;
    setNewArtist((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    setNewArtist({ artist: '', rating: '', date: '', city: '', country: '' });
    setIsModalOpen(false);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <button className="logout-btn" onClick={() => navigate('/')}>
          Logout
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{totalArtists}</div>
          <div className="stat-label">Total Artists Seen</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{artistsThisYear}</div>
          <div className="stat-label">Artists This Year</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-main">
          <div className="artists-section">
            <h2 className="section-title">Artists You've Seen</h2>
            {artistImages.length === 0 ? (
              <div className="empty-state">
                <p>No artists tracked yet. Start adding artists you've seen live!</p>
              </div>
            ) : (
              <div className="artists-grid">
                {artistImages.map((artist, index) => (
                  <div key={index} className="artist-card">
                    <img src={artist.image} alt={artist.name} className="artist-image" />
                    <div className="artist-name">{artist.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="plus-btn" onClick={() => setIsModalOpen(true)}>
                +
              </button>
            </div>
            <div className="filter-group">
              <div className="filter-label">Rating</div>
              <div className="filter-chips">
                {ratingOptions.map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={`filter-chip ${selectedRatings.includes(rating) ? 'active' : ''}`}
                    onClick={() => toggleRating(rating)}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-label">Date</div>
              <div className="date-inputs">
                <input
                  type="date"
                  name="start"
                  value={dateRange.start}
                  onChange={handleFilterInput}
                />
                <input
                  type="date"
                  name="end"
                  value={dateRange.end}
                  onChange={handleFilterInput}
                />
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-label">Country</div>
              <input
                type="text"
                name="country"
                value={filterFields.country}
                onChange={handleFilterInput}
                placeholder="Search country"
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <div className="filter-label">City</div>
              <input
                type="text"
                name="city"
                value={filterFields.city}
                onChange={handleFilterInput}
                placeholder="Search city"
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <div className="filter-label">Genre</div>
              <input
                type="text"
                name="genre"
                value={filterFields.genre}
                onChange={handleFilterInput}
                placeholder="Search genre"
                className="filter-input"
              />
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              ×
            </button>
            <h3 className="modal-title">Add Artist</h3>
            <form className="modal-form" onSubmit={handleModalSubmit}>
              <div className="modal-field">
                <label htmlFor="artist">Artist</label>
                <input
                  id="artist"
                  name="artist"
                  type="text"
                  value={newArtist.artist}
                  onChange={handleModalInput}
                  placeholder="Look up artist"
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="rating">Rating</label>
                <select
                  id="rating"
                  name="rating"
                  value={newArtist.rating}
                  onChange={handleModalInput}
                  required
                >
                  <option value="">Select rating</option>
                  {ratingOptions.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-field">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={newArtist.date}
                  onChange={handleModalInput}
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={newArtist.city}
                  onChange={handleModalInput}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div className="modal-field">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={newArtist.country}
                  onChange={handleModalInput}
                  placeholder="Enter country"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

