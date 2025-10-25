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
    { label: 'Under 630K₫', value: 'under30', action: () => onPriceFilter(0, 30) },
    { label: '630K₫ - 1.26M₫', value: '30-60', action: () => onPriceFilter(30, 60) },
    { label: '1.26M₫ - 2.1M₫', value: '60-100', action: () => onPriceFilter(60, 100) },
    { label: 'Over 2.1M₫', value: 'over100', action: () => onPriceFilter(100) },
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