import React, { useState } from 'react';
import SearchableDropdown from './SearchableDropdown';
import './SearchDemo.css';

function SearchDemo() {
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const handleArtistSelect = (artistId, artistData) => {
    console.log('Selected artist:', artistId, artistData);
    setSelectedArtist(artistData);
  };

  const handleGenreSelect = (genre) => {
    console.log('Selected genre:', genre);
    setSelectedGenre(genre);
  };

  const handleCountrySelect = (country) => {
    console.log('Selected country:', country);
    setSelectedCountry(country);
  };

  return (
    <div className="search-demo">
      <div className="search-demo-container">
        <h1>Search Demo</h1>
        <p className="demo-description">
          Try searching for artists, genres, or countries from our database of 100,000+ artists
        </p>

        <div className="search-section">
          <h2>Search for Artists</h2>
          <SearchableDropdown
            endpoint="/api/search/artists"
            placeholder="Type artist name (e.g., Taylor Swift, The Beatles)..."
            onSelect={handleArtistSelect}
            displayField="artist_name"
            valueField="artist_id"
            label="Artist Name"
          />
          {selectedArtist && (
            <div className="selected-item-display">
              <h3>Selected Artist:</h3>
              <div className="artist-card">
                {selectedArtist.artist_img && (
                  <img src={selectedArtist.artist_img} alt={selectedArtist.artist_name} />
                )}
                <div>
                  <p><strong>Name:</strong> {selectedArtist.artist_name}</p>
                  <p><strong>ID:</strong> {selectedArtist.artist_id}</p>
                  {selectedArtist.country && <p><strong>Country:</strong> {selectedArtist.country}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="search-section">
          <h2>Search for Genres</h2>
          <SearchableDropdown
            endpoint="/api/search/genres"
            placeholder="Type genre (e.g., Rock, Pop, Jazz)..."
            onSelect={handleGenreSelect}
            label="Genre"
          />
          {selectedGenre && (
            <div className="selected-item-display">
              <h3>Selected Genre:</h3>
              <p className="selected-value">{selectedGenre}</p>
            </div>
          )}
        </div>

        <div className="search-section">
          <h2>Search for Countries</h2>
          <SearchableDropdown
            endpoint="/api/search/countries"
            placeholder="Type country (e.g., USA, UK, Japan)..."
            onSelect={handleCountrySelect}
            label="Country"
          />
          {selectedCountry && (
            <div className="selected-item-display">
              <h3>Selected Country:</h3>
              <p className="selected-value">{selectedCountry}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchDemo;
