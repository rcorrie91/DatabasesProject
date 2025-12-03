import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newArtist, setNewArtist] = useState({ artist: '', rating: '', date: '', city: '', country: '' });
  const [artists, setArtists] = useState([]);
  const [allArtists, setAllArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const ratingOptions = Array.from({ length: 10 }, (_, index) => (index + 1).toString());

  const currentUserId = 27;

  useEffect(() => {
    fetchUserArtists();
  }, []);

  // Heartbeat to keep session active
  useEffect(() => {
    const sendHeartbeat = async () => {
      const sessionToken = localStorage.getItem('sessionToken');
      if (sessionToken) {
        try {
          await fetch('http://localhost:3001/api/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionToken }),
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 2 minutes
    const heartbeatInterval = setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(heartbeatInterval);
  }, []);

  const fetchUserArtists = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/user/${currentUserId}/artists`);
      const data = await response.json();

      if (response.ok) {
        setAllArtists(data);
        setArtists(data);
        console.log('All artists attached to account:', data);
        console.log('Total number of artists:', data.length);
        data.forEach((artist, index) => {
          console.log(`Artist ${index + 1}:`, {
            tracking_id: artist.tracking_id,
            artist_id: artist.artist_id,
            artist_name: artist.artist_name,
            date_seen: artist.date_seen,
            rating: artist.rating,
            venue: artist.venue,
            city: artist.city,
            country: artist.country,
            genres: artist.genres,
            notes: artist.notes,
            artist_img: artist.artist_img
          });
        });
      } else {
        console.error('Failed to fetch artists:', data.error);
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredArtistsForOptions = () => {
    let filtered = [...allArtists];

    if (selectedRatings.length > 0) {
      filtered = filtered.filter(artist => 
        artist.rating && selectedRatings.includes(artist.rating.toString())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        return new Date(artist.date_seen) >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return new Date(artist.date_seen) <= endDate;
      });
    }

    if (selectedCountries.length > 0) {
      filtered = filtered.filter(artist => {
        const country = artist.event_country || artist.country;
        return country && selectedCountries.includes(country);
      });
    }

    if (selectedCities.length > 0) {
      filtered = filtered.filter(artist => 
        artist.city && selectedCities.includes(artist.city)
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(artist => 
        artist.genres && artist.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    return filtered;
  };

  const getAvailableRatings = () => {
    let filtered = [...allArtists];

    if (dateRange.start) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        return new Date(artist.date_seen) >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return new Date(artist.date_seen) <= endDate;
      });
    }

    if (selectedCountries.length > 0) {
      filtered = filtered.filter(artist => {
        const country = artist.event_country || artist.country;
        return country && selectedCountries.includes(country);
      });
    }

    if (selectedCities.length > 0) {
      filtered = filtered.filter(artist => 
        artist.city && selectedCities.includes(artist.city)
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(artist => 
        artist.genres && artist.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    return [...new Set(filtered.map(a => a.rating).filter(Boolean).map(r => r.toString()))].sort((a, b) => parseInt(a) - parseInt(b));
  };

  const getAvailableCountries = () => {
    let filtered = [...allArtists];

    if (selectedRatings.length > 0) {
      filtered = filtered.filter(artist => 
        artist.rating && selectedRatings.includes(artist.rating.toString())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        return new Date(artist.date_seen) >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return new Date(artist.date_seen) <= endDate;
      });
    }

    if (selectedCities.length > 0) {
      filtered = filtered.filter(artist => 
        artist.city && selectedCities.includes(artist.city)
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(artist => 
        artist.genres && artist.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    return [...new Set(filtered.map(a => a.event_country || a.country).filter(Boolean))].sort();
  };

  const getAvailableCities = () => {
    let filtered = [...allArtists];

    if (selectedRatings.length > 0) {
      filtered = filtered.filter(artist => 
        artist.rating && selectedRatings.includes(artist.rating.toString())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        return new Date(artist.date_seen) >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return new Date(artist.date_seen) <= endDate;
      });
    }

    if (selectedCountries.length > 0) {
      filtered = filtered.filter(artist => {
        const country = artist.event_country || artist.country;
        return country && selectedCountries.includes(country);
      });
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(artist => 
        artist.genres && artist.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    return [...new Set(filtered.map(a => a.city).filter(Boolean))].sort();
  };

  const getAvailableGenres = () => {
    let filtered = [...allArtists];

    if (selectedRatings.length > 0) {
      filtered = filtered.filter(artist => 
        artist.rating && selectedRatings.includes(artist.rating.toString())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        return new Date(artist.date_seen) >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return new Date(artist.date_seen) <= endDate;
      });
    }

    if (selectedCountries.length > 0) {
      filtered = filtered.filter(artist => {
        const country = artist.event_country || artist.country;
        return country && selectedCountries.includes(country);
      });
    }

    if (selectedCities.length > 0) {
      filtered = filtered.filter(artist => 
        artist.city && selectedCities.includes(artist.city)
      );
    }

    return [...new Set(filtered.flatMap(a => a.genres || []).filter(Boolean))].sort();
  };

  const availableRatings = getAvailableRatings();
  const availableCountries = getAvailableCountries();
  const availableCities = getAvailableCities();
  const availableGenres = getAvailableGenres();

  useEffect(() => {
    const validCountries = getAvailableCountries();
    const validCities = getAvailableCities();
    const validGenres = getAvailableGenres();
    const validRatings = getAvailableRatings();

    if (selectedCountries.length > 0) {
      const invalidCountries = selectedCountries.filter(c => !validCountries.includes(c));
      if (invalidCountries.length > 0) {
        setSelectedCountries(prev => prev.filter(c => validCountries.includes(c)));
      }
    }

    if (selectedCities.length > 0) {
      const invalidCities = selectedCities.filter(c => !validCities.includes(c));
      if (invalidCities.length > 0) {
        setSelectedCities(prev => prev.filter(c => validCities.includes(c)));
      }
    }

    if (selectedGenres.length > 0) {
      const invalidGenres = selectedGenres.filter(g => !validGenres.includes(g));
      if (invalidGenres.length > 0) {
        setSelectedGenres(prev => prev.filter(g => validGenres.includes(g)));
      }
    }

    if (selectedRatings.length > 0) {
      const invalidRatings = selectedRatings.filter(r => !validRatings.includes(r));
      if (invalidRatings.length > 0) {
        setSelectedRatings(prev => prev.filter(r => validRatings.includes(r)));
      }
    }
  }, [selectedRatings, dateRange, selectedCountries, selectedCities, selectedGenres, allArtists]);

  useEffect(() => {
    let filtered = [...allArtists];

    if (selectedRatings.length > 0) {
      filtered = filtered.filter(artist => 
        artist.rating && selectedRatings.includes(artist.rating.toString())
      );
    }

    if (dateRange.start) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        return new Date(artist.date_seen) >= new Date(dateRange.start);
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter(artist => {
        if (!artist.date_seen) return false;
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        return new Date(artist.date_seen) <= endDate;
      });
    }

    if (selectedCountries.length > 0) {
      filtered = filtered.filter(artist => {
        const country = artist.event_country || artist.country;
        return country && selectedCountries.includes(country);
      });
    }

    if (selectedCities.length > 0) {
      filtered = filtered.filter(artist => 
        artist.city && selectedCities.includes(artist.city)
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(artist => 
        artist.genres && artist.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    setArtists(filtered);
  }, [selectedRatings, dateRange, selectedCountries, selectedCities, selectedGenres, allArtists]);

  const totalArtists = allArtists.length;
  const currentYear = new Date().getFullYear();
  const artistsThisYear = allArtists.filter(artist => {
    if (!artist.date_seen) return false;
    const dateSeen = new Date(artist.date_seen);
    return dateSeen.getFullYear() === currentYear;
  }).length;

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not recorded';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
  };

  const toggleCountry = (country) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((item) => item !== country) : [...prev, country]
    );
  };

  const toggleCity = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((item) => item !== city) : [...prev, city]
    );
  };

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((item) => item !== genre) : [...prev, genre]
    );
  };

  const clearAllFilters = () => {
    setSelectedRatings([]);
    setDateRange({ start: '', end: '' });
    setSelectedCountries([]);
    setSelectedCities([]);
    setSelectedGenres([]);
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
            <h2 className="section-title">
              Artists You've Seen {artists.length !== allArtists.length ? `(${artists.length} of ${allArtists.length})` : `(${artists.length})`}
            </h2>
            {isLoading ? (
              <div className="empty-state">
                <p>Loading artists...</p>
              </div>
            ) : artists.length === 0 ? (
              <div className="empty-state">
                <p>No artists tracked yet. Start adding artists you've seen live!</p>
              </div>
            ) : (
              <div className="artists-grid">
                {artists.map((artist) => (
                  <div key={artist.tracking_id} className="artist-card">
                    {artist.artist_img && (
                      <div className="artist-image-container">
                        <img 
                          src={artist.artist_img} 
                          alt={artist.artist_name} 
                          className="artist-image"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                    <div className="artist-card-content">
                      <h3 className="artist-name">{artist.artist_name}</h3>
                      <div className="artist-info-card">
                        {artist.date_seen && (
                          <div className="info-row">
                            <div className="info-icon-wrapper">
                              <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Date Seen</div>
                              <div className="info-value">{formatDate(artist.date_seen)}</div>
                            </div>
                          </div>
                        )}
                        <div className="info-row">
                          <div className="info-icon-wrapper rating-icon">
                            <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          </div>
                            <div className="info-content">
                              <div className="info-label">Rating</div>
                              <div className="info-value">{artist.rating ? `${artist.rating}/10` : 'Not rated'}</div>
                            </div>
                          </div>
                        {artist.venue && (
                          <div className="info-row">
                            <div className="info-icon-wrapper">
                              <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                              </svg>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Venue</div>
                              <div className="info-value">{artist.venue}</div>
                            </div>
                          </div>
                        )}
                        {artist.city && (
                          <div className="info-row">
                            <div className="info-icon-wrapper">
                              <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Location</div>
                              <div className="info-value">{artist.city}{artist.event_country ? `, ${artist.event_country}` : artist.country ? `, ${artist.country}` : ''}</div>
                            </div>
                          </div>
                        )}
                        {artist.genres && artist.genres.length > 0 && (
                          <div className="info-row">
                            <div className="info-icon-wrapper">
                              <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18V5l12-2v13"></path>
                                <circle cx="6" cy="18" r="3"></circle>
                                <circle cx="18" cy="16" r="3"></circle>
                              </svg>
                            </div>
                            <div className="info-content">
                              <div className="info-label">Genre</div>
                              <div className="info-value">{artist.genres.join(', ')}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="filters-panel">
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Clear
              </button>
            </div>
            <div className="filter-group">
              <div className="filter-label">Rating</div>
              <div className="filter-chips">
                {ratingOptions.map((rating) => {
                  const isAvailable = availableRatings.includes(rating);
                  return (
                    <button
                      key={rating}
                      type="button"
                      className={`filter-chip ${selectedRatings.includes(rating) ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                      onClick={() => isAvailable && toggleRating(rating)}
                      disabled={!isAvailable}
                    >
                      {rating}
                    </button>
                  );
                })}
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
              <div className="filter-dropdown">
                {availableCountries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    className={`filter-chip ${selectedCountries.includes(country) ? 'active' : ''}`}
                    onClick={() => toggleCountry(country)}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-label">City</div>
              <div className="filter-dropdown">
                {availableCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={`filter-chip ${selectedCities.includes(city) ? 'active' : ''}`}
                    onClick={() => toggleCity(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-label">Genre</div>
              <div className="filter-dropdown">
                {availableGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    className={`filter-chip ${selectedGenres.includes(genre) ? 'active' : ''}`}
                    onClick={() => toggleGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
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

