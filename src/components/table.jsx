// src/components/Table.jsx
import React from 'react';

/**
 * A generic table component with sorting, filtering, and custom formatting.
 * Props:
 * - columns: Array of { Header: string, accessor: string, sortable?: boolean }
 * - data: Array of data objects matching accessors
 * - onRowClick: optional function(row, rowIndex) callback when a row is clicked
 * - disabledRow: optional function(row) returning true to disable a row
 * - onHeaderClick: optional function(accessor) for sortable headers
 * - sortKey: string key currently sorted
 * - sortDir: 'asc' | 'desc'
 */
export default function Table({
  columns = [],
  data = [],
  onRowClick,
  disabledRow,
  onHeaderClick,
  sortKey,
  sortDir,
}) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => {
            const isSortable = col.sortable && typeof onHeaderClick === 'function';
            const isActive = sortKey === col.accessor;
            const arrow = isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
            return (
              <th
                key={col.accessor}
                className={isSortable ? 'sortable' : ''}
                onClick={isSortable ? () => onHeaderClick(col.accessor) : undefined}
              >
                {col.Header}{arrow}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => {
          const isDisabled = typeof disabledRow === 'function' && disabledRow(row);
          const isClickable = typeof onRowClick === 'function' && !isDisabled;
          const rowClasses = [];
          if (isDisabled) rowClasses.push('disabled');
          else if (isClickable) rowClasses.push('clickable');

          return (
            <tr
              key={rowIndex}
              className={rowClasses.join(' ')}
              onClick={isClickable ? () => onRowClick(row, rowIndex) : undefined}
            >
              {columns.map(col => {
                let cell = row[col.accessor];
                if (typeof cell === 'number') {
                  const keyLower = col.accessor.toLowerCase();
                  if (keyLower === 'fpts') {
                    cell = cell.toFixed(1);
                  } else if (keyLower === 'value') {
                    cell = cell.toFixed(2);
                  } else if (keyLower === 'salary') {
                    cell = cell.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    });
                  }
                }
                return <td key={col.accessor}>{cell}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
