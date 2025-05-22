// src/components/Table.jsx
import React from "react";

export default function Table({
  columns = [],
  data = [],
  disabledRow,
  onHeaderClick,
  sortKey,
  sortDir,
  selectedPlayers = [],
  className = "",
}) {
  return (
    <table className={className}>
      <thead>
        <tr>
          {columns.map((col) => {
            const isSortable =
              col.sortable && typeof onHeaderClick === "function";
            const isActive = sortKey === col.accessor;
            const arrow = isActive ? (sortDir === "asc" ? " ▲" : " ▼") : "";
            return (
              <th
                key={col.accessor}
                className={isSortable ? "sortable" : ""}
                onClick={
                  isSortable ? () => onHeaderClick(col.accessor) : undefined
                }
              >
                {col.Header}
                {arrow}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => {
          const isDisabled =
            typeof disabledRow === "function" && disabledRow(row);
          const rowClasses = [];
          if (isDisabled) rowClasses.push("disabled");
          if (selectedPlayers.includes(row.Player) || selectedPlayers.includes(row.player)) {
            rowClasses.push("selected-player");
          }
          
          // Salary exceeded is now handled at the table level

          return (
            <tr key={rowIndex} className={rowClasses.join(" ")}>
              {columns.map((col) => {
                const rawValue = row[col.accessor];
                let cell = rawValue;

                if (typeof col.Cell === "function") {
                  cell = col.Cell({ value: rawValue, row, rowIndex });
                } else if (typeof cell === "number") {
                  const keyLower = col.accessor.toLowerCase();
                  if (keyLower === "fpts") {
                    cell = cell.toFixed(1);
                  } else if (keyLower === "value") {
                    cell = cell.toFixed(2);
                  } else if (keyLower === "salary") {
                    cell = cell.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
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
