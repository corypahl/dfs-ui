// src/components/Table.jsx
import React from 'react';

/**
 * A generic table component.
 * Props:
 * - columns: Array of { Header: string, accessor: string }
 * - data: Array of data objects matching accessors
 * - onRowClick: optional function(row, rowIndex) callback when a row is clicked
 * - disabledRow: optional function(row) returning true to disable a row
 */
export default function Table({ columns = [], data = [], onRowClick, disabledRow }) {
  return (
    <table className="min-w-full border-collapse">
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.accessor} className="border-b px-4 py-2 text-left">
              {col.Header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => {
          const isDisabled = typeof disabledRow === 'function' && disabledRow(row);
          const isClickable = typeof onRowClick === 'function' && !isDisabled;
          return (
            <tr
              key={rowIndex}
              className={
                isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : isClickable
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : ''
              }
              onClick={() => {
                if (isClickable) onRowClick(row, rowIndex);
              }}
            >
              {columns.map(col => (
                <td key={col.accessor} className="border-b px-4 py-2">
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
