import React from 'react';
import './FilterButtons.css';

interface FilterButtonsProps {
  onPriceFilter: (minPrice?: number, maxPrice?: number) => void;
  onClearFilters: () => void;
  activeFilter?: string;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ 
  onPriceFilter, 
  onClearFilters,
  activeFilter 
}) => {
  const filterOptions = [
    { label: 'All Products', value: 'all', action: () => onClearFilters() },
    { label: 'Under $30', value: 'under30', action: () => onPriceFilter(0, 30) },
    { label: '$30 - $60', value: '30-60', action: () => onPriceFilter(30, 60) },
    { label: '$60 - $100', value: '60-100', action: () => onPriceFilter(60, 100) },
    { label: 'Over $100', value: 'over100', action: () => onPriceFilter(100) },
  ];

  return (
    <div className="filter-buttons">
      <div className="filter-container">
        <span className="filter-label">Filter by Price:</span>
        <div className="filter-options">
          {filterOptions.map((filter) => (
            <button
              key={filter.value}
              className={`filter-btn ${activeFilter === filter.value ? 'active' : ''}`}
              onClick={filter.action}
            >
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterButtons;