import { useState, useEffect } from 'react';
import LineupTable from './components/LineupTable';
import PlayersTable from './components/PlayersTable';

export default function App() {
  const [config, setConfig]   = useState(null);
  const [lineup, setLineup]   = useState([]);
  
  useEffect(() => {
    fetch(DATA_URL)
      .then(r => r.json())
      .then(data => {
        setConfig(data.Config[0]);
        setLineup(data.Config[0].Lineup.split(','));
      });
  }, []);

  if (!config) return <div>Loading…</div>;

  return (
    <main>
      <h1>DFS UI Dashboard</h1>
      <section>
        <h2>My Lineup</h2>
        <LineupTable config={config} />
      </section>
      <section>
        <h2>All Players</h2>
        <PlayersTable onSelect={player => {/* add to lineup */}} />
      </section>
    </main>
  );
}
