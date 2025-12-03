import React, { useState, useEffect, useRef } from 'react';
import './SearchableDropdown.css';

function SearchableDropdown({
  endpoint,
  placeholder = "Search...",
  onSelect,
  displayField = null,
  valueField = null,
  label = ""
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 1) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const url = `http://localhost:3001${endpoint}?query=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Error fetching results:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, endpoint]);

  const handleSelect = (item) => {
    // Handle both object and string results
    if (typeof item === 'string') {
      setSelectedItem(item);
      setQuery(item);
      if (onSelect) onSelect(item);
    } else {
      const display = displayField ? item[displayField] : item;
      const value = valueField ? item[valueField] : item;
      setSelectedItem(display);
      setQuery(display);
      if (onSelect) onSelect(value, item);
    }
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!e.target.value) {
      setSelectedItem(null);
      if (onSelect) onSelect(null);
    }
  };

  const handleInputFocus = () => {
    if (query && results.length > 0) {
      setIsOpen(true);
    }
  };

  const getDisplayText = (item) => {
    if (typeof item === 'string') return item;
    return displayField ? item[displayField] : JSON.stringify(item);
  };

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      {label && <label className="dropdown-label">{label}</label>}
      <div className="dropdown-input-container">
        <input
          type="text"
          className="dropdown-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          autoComplete="off"
        />
        {isLoading && <span className="dropdown-loading">...</span>}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="dropdown-results">
          {results.map((item, index) => (
            <li
              key={index}
              className="dropdown-result-item"
              onClick={() => handleSelect(item)}
            >
              {typeof item === 'string' ? (
                <span>{item}</span>
              ) : displayField === 'artist_name' ? (
                <div className="artist-result">
                  {item.artist_img && (
                    <img
                      src={item.artist_img}
                      alt={item.artist_name}
                      className="artist-thumb"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div className="artist-info">
                    <div className="artist-name">{item.artist_name}</div>
                    {item.country && <div className="artist-country">{item.country}</div>}
                  </div>
                </div>
              ) : (
                <span>{getDisplayText(item)}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && !isLoading && results.length === 0 && query && (
        <div className="dropdown-no-results">No results found</div>
      )}
    </div>
  );
}

export default SearchableDropdown;
