import Table from "./components/Table";

export default function LineupTable({ config }) {
  // parse positions & totals
  const positions = config.Lineup.split(',');
  const rows = positions.map(pos => ({ position: pos }));
  rows.push({ position: 'Total', salary: config.Salary });

  const columns = [
    { Header: 'Position', accessor: 'position' },
    { Header: 'Salary',    accessor: 'salary'    },
    { Header: 'Points',    accessor: 'points'    },
    { Header: 'Team',      accessor: 'team'      },
    { Header: 'Player',    accessor: 'player'    },
  ];

  return <Table columns={columns} data={rows} />;
}
