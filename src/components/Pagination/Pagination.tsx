import classnames from 'classnames';
import './pagination.css';
import { DOTS, usePagination } from './usePagination';
import { Key } from 'react';
// import { FaChevronRight } from "react-icons/fa6";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/* const Pagination = (props: any) => {
  const {
    onPageChange,
    totalCount,
    siblingCount = 1,
    currentPage,
    pageSize,
    className
  } = props;

  const paginationRange: any = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize
  });

  if (currentPage === 0 || paginationRange.length < 2) {
    return null;
  }

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  const lastPage = paginationRange[paginationRange.length - 1];
  return (
    <ul
      className={classnames('pagination-container', { [className]: className })}
    >
      <li
        className={classnames('pagination-item', {
          disabled: currentPage === 1
        })}
        onClick={onPrevious}
      >
        <div className="arrow left" />
      </li>
      {paginationRange.map((pageNumber: number | any, i: Key | null | undefined) => {
        if (pageNumber === DOTS) {
          return <li key={i} className="pagination-item dots">&#8230;</li>;
        }

        return (
          <li
            key={i}
            className={classnames('pagination-item', {
              selected: pageNumber === currentPage
            })}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </li>
        );
      })}
      <li
        className={classnames('pagination-item', {
          disabled: currentPage === lastPage
        })}
        onClick={onNext}
      >
        <div className="arrow right" />
      </li>
    </ul>
  );
};
 */

const Pagination = (props: any) => {
  const {
    onPageChange,
    totalCount,
    siblingCount = 1,
    currentPage,
    pageSize,
    className
  } = props;

  const paginationRange: any = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize
  });

  if (currentPage === 0 || paginationRange.length < 2) {
    return null;
  }

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  const lastPage = paginationRange[paginationRange.length - 1];
  return (
    <ul className={classnames('flex list-none', className)}>
      <li
        className={classnames(
          'flex items-center justify-center px-3 h-8 rounded-full',
          {
            'text-DARK-400 dark:text-DARK-500 cursor-not-allowed': currentPage === 1,
            'cursor-pointer': currentPage !== 1,
          }
        )}
        onClick={(e) => {
          if (currentPage === 1) {
            e.preventDefault();
          } else {
            onPrevious();
          }
        }}
      >
        <FaChevronLeft className="text-DARK-600 dark:text-DARK-200" />
      </li>
      {paginationRange.map((pageNumber: number | any, i: Key | null | undefined) => {
        if (pageNumber === DOTS) {
          return (
            <li key={i} className="px-3 py-2 text-DARK-600 dark:text-DARK-400">
              ...
            </li>
          );
        }
  
        return (
          <li
            key={i}
            className={classnames(
              'flex items-center justify-center px-3 h-8 rounded-full cursor-pointer',
              {
                'bg-BRAND-500 dark:bg-DARK-200 text-white dark:text-DARK-800': pageNumber === currentPage,
                'hover:bg-DARK-100 dark:hover:bg-DARK-500 text-DARK-700 dark:text-DARK-300':
                  pageNumber !== currentPage,
              }
            )}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </li>
        );
      })}
      <li
        className={classnames(
          'flex items-center justify-center px-3 h-8 rounded-full',
          {
            'text-DARK-400 dark:text-DARK-500 cursor-not-allowed': currentPage === lastPage,
            'cursor-pointer': currentPage !== lastPage,
          }
        )}
        onClick={(e) => {
          if (currentPage === lastPage) {
            e.preventDefault();
          } else {
            onNext();
          }
        }}
      >
        <FaChevronRight className="text-DARK-600 dark:text-DARK-200" />
      </li>
    </ul>
  );
  
};
export default Pagination;
