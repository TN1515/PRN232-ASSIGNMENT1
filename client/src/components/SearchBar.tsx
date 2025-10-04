import React, { useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search products...", 
  disabled = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="search-input"
            disabled={disabled}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" className="search-button" disabled={disabled}>
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBar;