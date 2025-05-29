import React, { useMemo } from 'react';
import Table from './table';
import '../styles/components/Shortlist.css';

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
    
    availablePositions.forEach(availablePos => { // Renamed 'position' to 'availablePos' for clarity
      const currentSlotPosition = availablePos.position;
      const allowedPlayerPositions = availablePos.allowedPositions;

      let bestPlayer = null;
      let highestOverall = -1;
      
      allowedPlayerPositions.forEach(playerPosType => { // e.g., SP, RP for P slot
        const eligiblePlayers = (positionGroups[playerPosType] || []).filter(p => 
          !selectedNames.includes(p.Player) && 
          p.Salary <= avgPerSlot
        );
        
        eligiblePlayers.forEach(p => {
          const overall = parseFloat(p.Overall || 0);
          if (overall > highestOverall) {
            highestOverall = overall;
            bestPlayer = { ...p, recommendedFor: currentSlotPosition };
          }
        });
      });
      
      if (bestPlayer) {
        recommendations.push(bestPlayer);
      } else {
        // Create and add placeholder if no best player found for this availablePosition
        const placeholder = {};
        if (players.length > 0) {
          const templatePlayer = players[0];
          for (const key in templatePlayer) {
            placeholder[key] = undefined; // Initialize with all keys from a real player
          }
        }
        // Set specific properties for the placeholder
        placeholder.Player = "--- Open Slot ---";
        placeholder.Pos = currentSlotPosition; // Use the lineup slot position here
        placeholder.Salary = null;
        placeholder.Fpts = null;
        placeholder.Overall = null;
        placeholder.Grade = "";
        placeholder.Team = "";
        placeholder['Fpts Grade'] = null; // Ensure common grade fields are nulled
        placeholder['Val Grade'] = null;
        placeholder.recommendedFor = currentSlotPosition; // For consistency
        
        recommendations.push(placeholder);
      }
    });
    
    return recommendations;
  }, [players, availablePositions, avgPerSlot, selectedNames]);

  const columns = useMemo(() => {
    // Ensure columns are generated even if players array is initially empty but recommendations might have placeholders
    // However, the current logic relies on players[0] for keys. If players is empty, Shortlist might not render anyway.
    // This subtask focuses on placeholder data, assuming `players` is not empty for column generation.
    if (!players.length && recommendations.length > 0 && recommendations[0].Player === "--- Open Slot ---") {
      // Attempt to generate columns from placeholder if players is empty but placeholders exist
      // This is a fallback, ideally players[0] is the source of truth for column structure
      return Object.keys(recommendations[0]).map(key => ({
        Header: key,
        accessor: key,
        sortable: true, // Basic sortable property
        Cell: ({ value, row }) => { // Basic cell renderer for placeholder
          if (key === "Player" && row.Player === "--- Open Slot ---") {
            return <span style={{ fontStyle: 'italic', color: '#aaa' }}>{value}</span>;
          }
          return value === null || value === undefined ? '' : String(value);
        }
      }));
    }
    if (!players.length) return [];
    
    return Object.keys(players[0]).map(key => {
      if (key === "Player") {
        return {
          Header: key,
          accessor: key,
          sortable: true,
          Cell: ({ value, row }) => {
            const isPlaceholder = row.Player === "--- Open Slot ---";
            const style = {};
            if (isPlaceholder) {
              style.fontStyle = 'italic';
              style.color = '#aaa';
            } else {
              style.cursor = 'pointer';
            }

            return (
              <span
                onClick={isPlaceholder ? undefined : () => addToLineup(row)}
                style={style}
              >
                {value}
              </span>
            );
          }
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
      <h2>Shortlist (Salary ≤ {avgPerSlot.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        })})</h2>
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
