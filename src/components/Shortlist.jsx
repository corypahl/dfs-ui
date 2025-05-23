import React, { useMemo } from 'react';
import Table from './table';
import './Shortlist.css';

const Shortlist = ({ 
  players, 
  lineup, 
  positionMap, 
  avgPerSlot,
  addToLineup,
  selectedNames,
  sortKey,
  sortDir,
  onHeaderClick
}) => {
  const availablePositions = useMemo(() => {
    return lineup
      .filter(slot => !slot.player)
      .map(slot => ({
        position: slot.position,
        allowedPositions: positionMap[slot.position] || [slot.position]
      }));
  }, [lineup, positionMap]);

  const recommendedPlayers = useMemo(() => {
    if (!players.length || !availablePositions.length) return [];

    // Group players by position
    const positionGroups = {};
    
    players.forEach(player => {
      if (!positionGroups[player.Pos]) {
        positionGroups[player.Pos] = [];
      }
      positionGroups[player.Pos].push(player);
    });
    
    // Find eligible players for each position
    const recommendations = [];
    
    availablePositions.forEach(({ position, allowedPositions }) => {
      let bestPlayer = null;
      let highestOverall = -1;
      
      allowedPositions.forEach(pos => {
        const eligiblePlayers = (positionGroups[pos] || []).filter(player => 
          // Must not be already in lineup
          !selectedNames.includes(player.Player) && 
          // Must be within salary cap
          player.Salary <= avgPerSlot
        );
        
        eligiblePlayers.forEach(player => {
          const overall = parseFloat(player.Overall || 0);
          if (overall > highestOverall) {
            highestOverall = overall;
            bestPlayer = { ...player, recommendedFor: position };
          }
        });
      });
      
      if (bestPlayer) {
        recommendations.push(bestPlayer);
      }
    });
    
    return recommendations;
  }, [players, availablePositions, avgPerSlot, selectedNames]);

  const columns = useMemo(() => {
    if (!players.length) return [];
    
    return Object.keys(players[0]).map(key => {
      if (key === "Player") {
        return {
          Header: key,
          accessor: key,
          sortable: true,
          Cell: ({ value, row }) => (
            <span
              onClick={() => addToLineup(row)}
              style={{ cursor: "pointer" }}
            >
              {value}
            </span>
          )
        };
      }
      
      return {
        Header: key,
        accessor: key,
        sortable: true
      };
    });
  }, [players, addToLineup]);

  const isRecommended = (player) => {
    return recommendedPlayers.some(
      p => p.Player === player.Player && p.Pos === player.Pos
    );
  };

  if (!players.length || avgPerSlot <= 0) {
    return null;
  }

  const filteredPlayers = players.filter(player => 
    // Must not be already in lineup
    !selectedNames.includes(player.Player) &&
    // Must be affordable within the average slot value
    player.Salary <= avgPerSlot &&
    // Must be eligible for an available position
    availablePositions.some(({ allowedPositions }) => 
      allowedPositions.includes(player.Pos)
    )
  );

  return (
    <div className="shortlist">
      <h3>Shortlist (Salary ≤ {avgPerSlot.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        })})</h3>
      <Table
        columns={columns}
        data={recommendedPlayers}
        onRowClick={addToLineup}
        getRowProps={() => ({
          className: 'recommended-player'
        })}
        disabledRow={() => false}
        onHeaderClick={onHeaderClick}
        sortKey={sortKey}
        sortDir={sortDir}
      />
    </div>
  );
};

export default Shortlist;
