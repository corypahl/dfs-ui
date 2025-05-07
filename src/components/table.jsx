// src/components/Table.jsx
export default function Table({ columns, data, onRowClick }) {
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
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map(col => (
                <td key={col.accessor} className="border-b px-4 py-2">
                  {row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  