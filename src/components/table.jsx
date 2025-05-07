// src/components/Table.jsx
import React from 'react';

/**
 * A generic table component with dark-mode styling.
 * Props:
 * - columns: Array of { Header: string, accessor: string }
 * - data: Array of data objects matching accessors
 * - onRowClick: optional function(row, rowIndex) callback when a row is clicked
 * - disabledRow: optional function(row) returning true to disable a row
 */
export default function Table({ columns = [], data = [], onRowClick, disabledRow }) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.accessor} className={col.sortable ? 'sortable' : ''}>
              {col.Header}
            </th>
          ))}
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
              onClick={() => {
                if (isClickable) onRowClick(row, rowIndex);
              }}
            >
              {columns.map(col => (
                <td key={col.accessor}>
                  {row[col.accessor]}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
