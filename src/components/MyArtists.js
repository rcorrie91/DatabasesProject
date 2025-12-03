import React, { useState, useEffect } from 'react';
import './MyArtists.css';

function MyArtists() {
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // For demo purposes - in production you'd get this from login session
  const currentUserId = 4; // Using one of our test users

  useEffect(() => {
    fetchMyArtists();
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

  const fetchMyArtists = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/user/${currentUserId}/artists`);
      const data = await response.json();

      if (response.ok) {
        setArtists(data);
      } else {
        setError(data.error || 'Failed to load artists');
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not recorded';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="my-artists-page">
        <div className="my-artists-container">
          <div className="loading">Loading your artists...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-artists-page">
        <div className="my-artists-container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-artists-page">
      <div className="my-artists-container">
        <div className="page-header">
          <h1>My Artists</h1>
          <p className="page-description">
            Artists I've seen live ({artists.length} {artists.length === 1 ? 'artist' : 'artists'})
          </p>
        </div>

        {artists.length === 0 ? (
          <div className="empty-state">
            <h3>No artists yet!</h3>
            <p>Start tracking artists you've seen by visiting the Artist Tracker</p>
            <a href="/tracker" className="add-artists-link">
              Add Your First Artist
            </a>
          </div>
        ) : (
          <div className="artists-grid">
            {artists.map((artist) => (
              <div key={artist.tracking_id} className="artist-card">
                <div className="artist-card-header">
                  {artist.artist_img && (
                    <img
                      src={artist.artist_img}
                      alt={artist.artist_name}
                      className="artist-card-image"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="artist-card-info">
                    <h3 className="artist-card-name">{artist.artist_name}</h3>
                    {artist.country && (
                      <p className="artist-card-country">{artist.country}</p>
                    )}
                  </div>
                </div>

                <div className="artist-card-details">
                  {artist.date_seen && (
                    <div className="detail-row">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(artist.date_seen)}</span>
                    </div>
                  )}

                  {artist.venue && (
                    <div className="detail-row">
                      <span className="detail-label">Venue:</span>
                      <span className="detail-value">{artist.venue}</span>
                    </div>
                  )}

                  {artist.city && (
                    <div className="detail-row">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{artist.city}</span>
                    </div>
                  )}

                  {artist.notes && (
                    <div className="detail-row notes">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{artist.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyArtists;
