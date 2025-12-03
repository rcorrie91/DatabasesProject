import React, { useState } from 'react';
import SearchableDropdown from './SearchableDropdown';
import './ArtistTracker.css';

function ArtistTracker() {
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [otherFans, setOtherFans] = useState([]);
  const [addSuccess, setAddSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date_seen: '',
    venue: '',
    city: '',
    notes: ''
  });

  // For demo purposes - in production you'd get this from login session
  const currentUserId = 4; // Using one of our test users

  const handleArtistSelect = async (artistId, artistData) => {
    setSelectedArtist(artistData);
    setAddSuccess(false);
    setOtherFans([]);

    // Fetch other fans who have seen this artist
    try {
      const response = await fetch(`http://localhost:3001/api/artists/${artistId}/fans`);
      const fans = await response.json();
      setOtherFans(fans);
    } catch (error) {
      console.error('Error fetching fans:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddArtist = async (e) => {
    e.preventDefault();

    if (!selectedArtist) {
      alert('Please select an artist first');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/user/${currentUserId}/artists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist_id: selectedArtist.artist_id,
          date_seen: formData.date_seen,
          venue: formData.venue,
          city: formData.city,
          notes: formData.notes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAddSuccess(true);
        // Refresh the fans list to include the current user
        const fansResponse = await fetch(`http://localhost:3001/api/artists/${selectedArtist.artist_id}/fans`);
        const fans = await fansResponse.json();
        setOtherFans(fans);

        // Clear form
        setFormData({
          date_seen: '',
          venue: '',
          city: '',
          notes: ''
        });
      } else {
        alert(data.error || 'Failed to add artist');
      }
    } catch (error) {
      console.error('Error adding artist:', error);
      alert('Error adding artist');
    }
  };

  return (
    <div className="artist-tracker">
      <div className="artist-tracker-container">
        <h1>Track Artists You've Seen</h1>
        <p className="tracker-description">
          Search for artists you've seen live and connect with other fans
        </p>

        <div className="artist-search-section">
          <h2>Search for an Artist</h2>
          <SearchableDropdown
            endpoint="/api/search/artists"
            placeholder="Type artist name..."
            onSelect={handleArtistSelect}
            displayField="artist_name"
            valueField="artist_id"
            label="Artist Name"
          />
        </div>

        {selectedArtist && (
          <div className="selected-artist-section">
            <div className="artist-details">
              {selectedArtist.artist_img && (
                <img
                  src={selectedArtist.artist_img}
                  alt={selectedArtist.artist_name}
                  className="artist-image"
                />
              )}
              <div className="artist-info">
                <h3>{selectedArtist.artist_name}</h3>
                {selectedArtist.country && <p>Country: {selectedArtist.country}</p>}
              </div>
            </div>

            <form onSubmit={handleAddArtist} className="add-artist-form">
              <h3>Add to Your Collection</h3>

              <div className="form-group">
                <label>Date Seen (Optional)</label>
                <input
                  type="date"
                  name="date_seen"
                  value={formData.date_seen}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Venue (Optional)</label>
                <input
                  type="text"
                  name="venue"
                  placeholder="e.g., Madison Square Garden"
                  value={formData.venue}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>City (Optional)</label>
                <input
                  type="text"
                  name="city"
                  placeholder="e.g., New York, NY"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  name="notes"
                  placeholder="Any memorable moments or thoughts..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <button type="submit" className="add-button">
                Add to My Artists
              </button>

              {addSuccess && (
                <div className="success-message">
                  Artist added successfully!
                </div>
              )}
            </form>

            {otherFans.length > 0 && (
              <div className="other-fans-section">
                <h3>Other Fans Who've Seen {selectedArtist.artist_name}</h3>
                <p className="fans-count">{otherFans.length} {otherFans.length === 1 ? 'fan' : 'fans'} found</p>

                <div className="fans-list">
                  {otherFans.map((fan) => (
                    <div key={fan.id} className="fan-card">
                      <div className="fan-avatar">
                        {fan.profile_image_url ? (
                          <img src={fan.profile_image_url} alt={fan.nickname} />
                        ) : (
                          <div className="avatar-placeholder">
                            {fan.first_name[0]}{fan.last_name[0]}
                          </div>
                        )}
                      </div>
                      <div className="fan-info">
                        <div className="fan-name">
                          {fan.first_name} {fan.last_name}
                        </div>
                        <div className="fan-nickname">@{fan.nickname}</div>
                        {(fan.city || fan.state) && (
                          <div className="fan-location">
                            {fan.city}{fan.city && fan.state ? ', ' : ''}{fan.state}
                          </div>
                        )}
                        <div className="fan-stats">
                          Seen {fan.times_seen} {fan.times_seen === 1 ? 'time' : 'times'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtistTracker;
