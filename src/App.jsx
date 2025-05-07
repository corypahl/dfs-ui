import React, { useState, useEffect, useMemo } from "react";
import Table from "./components/table";

const DATA_URL =
  "https://script.google.com/macros/s/AKfycbzODSyKW5YZpujVWZMr8EQkpMKRwaKPI_lYiAv2mxDe-dCr9LRfEjt8-wzqBB_X4QKxug/exec";

// Define the 6 columns for the lineup table
const lineupColumns = [
  { Header: "Position", accessor: "position" },
  { Header: "Player",   accessor: "player"   },
  { Header: "Team",     accessor: "team"     },
  { Header: "Salary",   accessor: "salary"   },
  { Header: "Fpts",     accessor: "fpts"     },
  { Header: "Grade",    accessor: "grade"    },
];

export default function App() {
  const [players, setPlayers] = useState([]);
  const [playerColumns, setPlayerColumns] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [positionMap, setPositionMap] = useState({});
  const [positions, setPositions] = useState([]);
  const [disabledPositions, setDisabledPositions] = useState([]);
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [salaryCap, setSalaryCap] = useState(0);

  // Fetch data from API and initialize state
  useEffect(() => {
    fetch(DATA_URL)
      .then(res => res.json())
      .then(data => {
        const cfg = data.Config[0];
        setPositions(cfg.Positions.split(","));
        try {
          const mapObj = JSON.parse(cfg.Map.replace(/'/g, '"'));
          setPositionMap(mapObj);
        } catch (err) {
          console.error("Error parsing position map:", err);
        }
        setPlayers(data.Players);
        setPlayerColumns(
          Object.keys(data.Players[0]).map(key => ({
            Header: key,
            accessor: key,
            sortable: true,
          }))
        );
        const slots = cfg.Lineup.split(",").map(pos => ({
          position: pos,
          player:  "",
          team:    "",
          salary:  0,
          fpts:    0,
          grade:   "",
        }));
        setLineup(slots);
        setSalaryCap(Number(cfg.Salary) || 0);
      })
      .catch(console.error);
  }, []);

  // Append a total row whenever lineup changes
  const lineupWithTotal = useMemo(() => {
    const totalSalary = lineup.reduce((sum, slot) => sum + (slot.salary || 0), 0);
    const totalFpts   = lineup.reduce((sum, slot) => sum + (slot.fpts   || 0), 0);
    return [
      ...lineup,
      {
        position: "Total",
        player:   "",
        team:     "",
        salary:   totalSalary,
        fpts:     totalFpts,
        grade:    "",
      }
    ];
  }, [lineup]);

  // Compute remaining salary and average per open slot
  const { remainingSalary, openSlots, avgPerSlot } = useMemo(() => {
    const totalSalary = lineup.reduce((sum, slot) => sum + (slot.salary || 0), 0);
    const open = lineup.filter(slot => !slot.player).length;
    const remaining = salaryCap - totalSalary;
    const avg = open > 0 ? remaining / open : 0;
    return { remainingSalary: remaining, openSlots: open, avgPerSlot: avg };
  }, [lineup, salaryCap]);

  // Filter and sort players
  const filteredSortedPlayers = useMemo(() => {
    let list = [...players];
    if (disabledPositions.length) {
      list = list.filter(p =>
        !disabledPositions.some(slotPos => {
          const allowed = positionMap[slotPos] || [slotPos];
          return allowed.includes(p.Pos);
        })
      );
    }
    if (sortKey) {
      list.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [players, disabledPositions, sortKey, sortDir, positionMap]);

  const togglePosition = pos => {
    setDisabledPositions(curr =>
      curr.includes(pos) ? curr.filter(p => p !== pos) : [...curr, pos]
    );
  };

  const handleSort = accessor => {
    if (sortKey === accessor) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(accessor);
      setSortDir('asc');
    }
  };

  function addToLineup(playerObj) {
    setLineup(curr => {
      const idx = curr.findIndex(slot =>
        !slot.player && (positionMap[slot.position] || [slot.position]).includes(playerObj.Pos)
      );
      if (idx === -1) return curr;
      const next = [...curr];
      next[idx] = {
        ...next[idx],
        player: playerObj.Player,
        team:   playerObj.Team,
        salary: playerObj.Salary ?? 0,
        fpts:   playerObj.Fpts   ?? 0,
        grade:  playerObj.Grade  ?? "",
      };
      return next;
    });
  }

  function removeFromLineup(_, idx) {
    setLineup(curr => {
      const next = [...curr];
      next[idx] = { ...next[idx], player: "", team: "", salary: 0, fpts: 0, grade: "" };
      return next;
    });
  }

  // Loading state
  if (!playerColumns.length || !lineup.length) {
    return <div id="loading">Loading…</div>;
  }

  return (
    <main>
      <h1>DFS UI Dashboard</h1>

      <section>
        <h2>My Lineup (click to remove)</h2>
        <Table
          columns={lineupColumns}
          data={lineupWithTotal}
          onRowClick={removeFromLineup}
          disabledRow={row => row.position === "Total"}
        />
        <div className="lineup-stats">
          <p>
            Remaining Salary: {remainingSalary.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            })}
          </p>
          <p>
            Average per Slot: {avgPerSlot.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            })} {openSlots > 0 && `(across ${openSlots} slots)`}
          </p>
        </div>
      </section>

      <section>
        <h2>All Players (click to add)</h2>
        <div className="table-controls">
          {positions.map(pos => (
            <button
              key={pos}
              className={disabledPositions.includes(pos) ? 'tab disabled' : 'tab'}
              onClick={() => togglePosition(pos)}
            >
              {pos}
            </button>
          ))}
        </div>
        <Table
          columns={playerColumns}
          data={filteredSortedPlayers}
          onRowClick={addToLineup}
          disabledRow={player =>
            lineup.some(slot => slot.player === player.Player) ||
            !lineup.some(
              slot =>
                !slot.player &&
                (positionMap[slot.position] || [slot.position]).includes(player.Pos)
            )
          }
          onHeaderClick={handleSort}
          sortKey={sortKey}
          sortDir={sortDir}
        />
      </section>
    </main>
  );
}
