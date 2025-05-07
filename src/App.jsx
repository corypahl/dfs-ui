import { useState, useEffect } from "react";
import Table from "./components/Table";

const DATA_URL =
  "https://script.google.com/macros/s/AKfycbzODSyKW5YZpujVWZMr8EQkpMKRwaKPI_lYiAv2mxDe-dCr9LRfEjt8-wzqBB_X4QKxug/exec";

export default function App() {
  const [lineup, setLineup] = useState([]);
  const [players, setPlayers] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    fetch(DATA_URL)
      .then(res => res.json())
      .then(data => {
        setLineup(data.Config);
        setPlayers(data.Players);
        deriveColumns(data.Players);
      })
      .catch(err => console.error(err));
  }, []);
  
  
  // helper to turn an object-keys list into column defs
  function deriveColumns(sampleArray) {
    if (!sampleArray.length) return;
    const cols = Object.keys(sampleArray[0])
      // drop any internal flags if you like:
      .filter((key) => key !== "is_lineup")
      .map((key) => ({
        Header: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        accessor: key,
      }));
    setColumns(cols);
  }

  if (!columns.length) {
    return <div className="m-8">Loading data…</div>;
  }

  return (
    <main className="m-8 space-y-8">
      <h1 className="text-2xl font-bold">DFS UI Dashboard</h1>

      <section>
        <h2 className="text-xl mb-2">My Lineup</h2>
        <Table columns={columns} data={lineup} />
      </section>

      <section>
        <h2 className="text-xl mb-2">All Players</h2>
        <Table columns={columns} data={players} />
      </section>
    </main>
  );
}
