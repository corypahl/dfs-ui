// src/App.jsx
import { useState, useEffect } from "react";
import Table from "./components/table";

const DATA_URL =
  "https://script.google.com/macros/s/AKfycbzODSyKW5YZpujVWZMr8EQkpMKRwaKPI_lYiAv2mxDe-dCr9LRfEjt8-wzqBB_X4QKxug/exec";

// define exactly 5 columns for your lineup table
const lineupColumns = [
  { Header: "Position", accessor: "position" },
  { Header: "Player", accessor: "player" },
  { Header: "Team", accessor: "team" },
  { Header: "Salary", accessor: "salary" },
  { Header: "Points", accessor: "points" },
];

export default function App() {
  const [players, setPlayers] = useState([]);
  const [playerColumns, setPlayerColumns] = useState([]);
  const [lineup, setLineup] = useState([]);

  useEffect(() => {
    fetch(DATA_URL)
      .then((res) => res.json())
      .then((data) => {
        // 1) load all players & derive their columns
        setPlayers(data.Players);
        const cols = Object.keys(data.Players[0]).map((key) => ({
          Header: key,
          accessor: key,
        }));
        setPlayerColumns(cols);

        // 2) build initial, empty lineup slots from your config
        const cfg = data.Config[0];
        const slots = cfg.Lineup.split(",").map((pos) => ({
          position: pos,
          player: "",
          team: "",
          salary: 0,
          points: 0,
        }));
        setLineup(slots);
      })
      .catch(console.error);
  }, []);

  // add a player into the first empty slot
  function addToLineup(playerObj) {
    setLineup((curr) => {
      const next = [...curr];
      const emptyIdx = next.findIndex((s) => !s.player);
      if (emptyIdx === -1) return curr; // all slots full
      next[emptyIdx] = {
        position: next[emptyIdx].position,
        player: playerObj.Player,
        team: playerObj.Team,
        salary: playerObj.Salary ?? 0,
        points: playerObj.Points ?? 0,
      };
      return next;
    });
  }

  // clear a slot when clicked in the lineup table
  function removeFromLineup(slot) {
    setLineup((curr) =>
      curr.map((s) =>
        s.position === slot.position
          ? { position: s.position, player: "", team: "", salary: 0, points: 0 }
          : s
      )
    );
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
          disabledRow={(player) =>
            lineup.some((slot) => slot.player === player.Player)
          }
        />
      </section>
    </main>
  );
}
