// src/App.jsx
import { useState, useEffect } from "react";
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

// Map lineup slots to acceptable player positions
const positionMap = {
  "P":    ["SP", "RP"],
  "C/1B": ["C", "1B"],
  "2B":   ["2B"],
  "3B":   ["3B"],
  "SS":   ["SS"],
  "OF":   ["LF", "CF", "RF"],
  "UTIL": ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"],
};

export default function App() {
  const [players, setPlayers] = useState([]);
  const [playerColumns, setPlayerColumns] = useState([]);
  const [lineup, setLineup] = useState([]);

  useEffect(() => {
    fetch(DATA_URL)
      .then(res => res.json())
      .then(data => {
        // Load players and derive columns
        setPlayers(data.Players);
        const cols = Object.keys(data.Players[0]).map(key => ({
          Header: key,
          accessor: key,
        }));
        setPlayerColumns(cols);

        // Initialize lineup slots
        const cfg = data.Config[0];
        const slots = cfg.Lineup.split(",").map(pos => ({
          position: pos,
          player:  "",
          team:    "",
          salary:  0,
          fpts:    0,
          grade:   "",
        }));
        setLineup(slots);
      })
      .catch(console.error);
  }, []);

  // Add a player into the first compatible empty slot
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
        fpts:   playerObj.Fpts ?? 0,
        grade:  playerObj.Grade ?? "",
      };
      return next;
    });
  }

  // Remove a player from a specific slot (by index)
  function removeFromLineup(_, index) {
    setLineup(curr => {
      const next = [...curr];
      next[index] = { ...next[index], player: "", team: "", salary: 0, fpts: 0, grade: "" };
      return next;
    });
  }

  if (!playerColumns.length || !lineup.length) {
    return <div className="m-8">Loading…</div>;
  }

  return (
    <main className="m-8 space-y-8">
      <h1 className="text-2xl font-bold">DFS UI Dashboard</h1>

      <section>
        <h2 className="text-xl mb-2">My Lineup (click to remove)</h2>
        <Table
          columns={lineupColumns}
          data={lineup}
          onRowClick={removeFromLineup}
        />
      </section>

      <section>
        <h2 className="text-xl mb-2">All Players (click to add)</h2>
        <Table
          columns={playerColumns}
          data={players}
          onRowClick={addToLineup}
          disabledRow={player =>
            // disable if already in lineup or no slot accepts them
            lineup.some(slot => slot.player === player.Player) ||
            !lineup.some(
              slot =>
                !slot.player &&
                (positionMap[slot.position] || [slot.position]).includes(player.Pos)
            )
          }
        />
      </section>
    </main>
  );
}
