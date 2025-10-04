import React from 'react';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 6
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Hiển thị tất cả nếu ít hơn maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic phức tạp hơn cho nhiều trang
      if (currentPage <= 3) {
        // Gần đầu
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Gần cuối
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Ở giữa
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Luôn hiển thị pagination khi có ít nhất 1 item
  if (totalPages < 1 || !totalItems || totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  return (
    <div className="pagination-container">
      {totalItems && (
        <div className="pagination-info">
          Showing {startItem}-{endItem} of {totalItems} products
        </div>
      )}
      
      <nav className={`pagination ${totalPages === 1 ? 'single-page' : ''}`}>
        <button
          className={`pagination-btn prev ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalPages === 1}
        >
          <span className="pagination-icon">‹</span>
          <span>Previous</span>
        </button>

        <div className="pagination-numbers">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="pagination-ellipsis">...</span>
              ) : (
                <button
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => onPageChange(page as number)}
                >
                  <span>{page}</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          className={`pagination-btn next ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 1}
        >
          <span>Next</span>
          <span className="pagination-icon">›</span>
        </button>
      </nav>
    </div>
  );
};

export default Pagination;