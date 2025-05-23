import React, { useMemo } from 'react';
import '../styles/components/LineupStats.css';

const LineupStats = ({ lineup, salaryCap }) => {
  const { remainingSalary, openSlots, avgPerSlot, lineupStatus } = useMemo(() => {
    const totalSalary = lineup.reduce(
      (sum, slot) => sum + (slot.salary || 0),
      0
    );
    const open = lineup.filter((slot) => !slot.player).length;
    const remaining = salaryCap - totalSalary;
    const avg = open > 0 ? remaining / open : 0;

    let status = ""; // This is for local styling of text, not the table's border
    if (remaining < 0) {
      status = "negative"; // Class for text color
    } else if (open === 0 && remaining >= 0) {
      status = "positive"; // Class for text color
    }

    return {
      remainingSalary: remaining,
      openSlots: open,
      avgPerSlot: avg,
      lineupStatus: status, // Renamed to avoid confusion with table's border status
    };
  }, [lineup, salaryCap]);

  return (
    <div className="lineup-stats">
      <p className={lineupStatus === 'negative' ? 'negative-salary' : (lineupStatus === 'positive' ? 'valid-salary' : '')}>
        Remaining Salary:{" "}
        {remainingSalary.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        })}
      </p>
      <p className={lineupStatus === 'negative' ? 'negative-salary' : (lineupStatus === 'positive' ? 'valid-salary' : '')}>
        Average per Slot:{" "}
        {avgPerSlot.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        })}{" "}
        {openSlots > 0 && `(across ${openSlots} slots)`}
      </p>
    </div>
  );
};

export default LineupStats;
