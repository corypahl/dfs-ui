import React, {useCallback, useEffect, useMemo, useState} from "react";
import Table from "./components/table";
import InjuryTooltip from "./components/./InjuryTooltip.jsx";
import MatchupTooltip from "./components/MatchupTooltip.jsx";
import NewsTooltip from "./components/NewsTooltip.jsx";
import Shortlist from "./components/Shortlist.jsx";
import LineupStats from "./components/LineupStats.jsx";
import './styles/global.css';
import './styles/components/TableControls.css';
import './styles/layouts.css';

const DATA_URL =
    "https://script.google.com/macros/s/AKfycbzODSyKW5YZpujVWZMr8EQkpMKRwaKPI_lYiAv2mxDe-dCr9LRfEjt8-wzqBB_X4QKxug/exec";

// Helper function to calculate letter grade
function calculateGrade(overallScore) {
  if (overallScore <= 0) {
    return ""; // Return empty string if overall is not positive
  }
  if (overallScore >= 97) {
    return "A+";
  }
  if (overallScore >= 93) {
    return "A";
  }
  if (overallScore >= 90) {
    return "A-";
  }
  if (overallScore >= 87) {
    return "B+";
  }
  if (overallScore >= 83) {
    return "B";
  }
  if (overallScore >= 80) {
    return "B-";
  }
  if (overallScore >= 77) {
    return "C+";
  }
  if (overallScore >= 73) {
    return "C";
  }
  if (overallScore >= 70) {
    return "C-";
  }
  if (overallScore >= 67) {
    return "D+";
  }
  if (overallScore >= 63) {
    return "D";
  }
  if (overallScore >= 60) {
    return "D-";
  }
  return "F"; // For scores less than 60 but greater than 0
}

export default function App() {
    const [players, setPlayers] = useState([]);
    const [lineup, setLineup] = useState([]);
    const [positionMap, setPositionMap] = useState({});
    const [positions, setPositions] = useState([]);
    const [disabledPositions, setDisabledPositions] = useState([]);
    const [sortKey, setSortKey] = useState("");
    const [sortDir, setSortDir] = useState("asc");
    const [salaryCap, setSalaryCap] = useState(0);
    const [maxSalary, setMaxSalary] = useState("");
    const [weightingFactor, setWeightingFactor] = useState(0.5); // Added weightingFactor state
    const [injuryMap, setInjuryMap] = useState({});
    const [matchupMap, setMatchupMap] = useState({});
    const [newsMap, setNewsMap] = useState({});

    // keep track of which names are in the lineup
    const selectedNames = useMemo(
        () => lineup.map((slot) => slot.player).filter(Boolean),
        [lineup]
    );

    const removeFromLineup = useCallback((_, idx) => {
        setLineup((curr) => {
            const next = [...curr];
            next[idx] = {
                ...next[idx],
                player: "",
                team: "",
                salary: 0,
                fpts: 0,
                grade: "",
            };
            return next;
        });
    }, []);

    const lineupColumns = useMemo(() => {
        return [
            {Header: "Position", accessor: "position"},
            {
                Header: "Player",
                accessor: "player",
                Cell: ({value, row}) => {
                    return row.position !== "Total" ? (
                        <span
                            onClick={() => removeFromLineup(null, row.index)}
                            className="clickable-name"
                        >
              {value}
            </span>
                    ) : (
                        value
                    );
                },
            },
            {Header: "Grade", accessor: "grade"},
        ];
    }, [removeFromLineup]);

    useEffect(() => {
        fetch(DATA_URL)
            .then((res) => res.json())
            .then((data) => {
                const cfg = data.Config[0];
                setPositions(cfg.Positions.split(","));
                try {
                    const mapObj = JSON.parse(cfg.Map.replace(/'/g, '"'));
                    setPositionMap(mapObj);
                } catch (err) {
                    console.error("Error parsing position map:", err);
                }

                const injuries = data.Injuries || [];
                const injuryMap = {};
                injuries.forEach((inj) => {
                    if (inj.Name) {
                        const key = inj.Name.trim().toLowerCase();
                        injuryMap[key] = `${inj.Inury || "Injury"} — ${
                            inj.Status || "Status unknown"
                        }`;
                    }
                });
                setInjuryMap(injuryMap);

                const matchups = data.Matchups || [];
                const matchupMap = {};
                matchups.forEach((m) => {
                    matchupMap[m.Team] = {
                        opponent: m.Opponent,
                        spread: m.Spread,
                        total: m.Total,
                        gameTime: m.GameTime,
                    };
                });
                setMatchupMap(matchupMap);

                const news = data.News || [];
                const newsMap = {};
                news.forEach((article) => {
                    if (article.Name) {
                        const key = article.Name.trim().toLowerCase();
                        newsMap[key] = `${article.News || "News"}`;
                    }
                });
                setNewsMap(newsMap);

                // Calculate Overall for each player
                const playersWithOverall = data.Players.map(player => {
                    const fptsGrade = player['Fpts Grade'];
                    const valGrade = player['Val Grade'];
                    let overall = 0; // Default Overall
                    if (typeof fptsGrade === 'number' && typeof valGrade === 'number') {
                        overall = Math.round((fptsGrade * (1 - weightingFactor)) + (valGrade * weightingFactor));
                    }
                    // If player.Overall already existed and was a number (e.g. from source), round it too.
                    // However, current logic calculates fresh or defaults to 0, so Math.round(0) is fine.
                    const grade = calculateGrade(overall);
                    return { ...player, Overall: overall, Grade: grade };
                });
                setPlayers(playersWithOverall);

                const slots = cfg.Lineup.split(",").map((pos) => ({
                    position: pos,
                    player: "",
                    team: "",
                    salary: 0,
                    fpts: 0,
                    grade: "",
                }));
                setLineup(slots);
                setSalaryCap(Number(cfg.Salary) || 0);
            })
            .catch(console.error);
    }, []);

    const addToLineup = useCallback((playerObj) => {
        setLineup((curr) => {
            const idx = curr.findIndex(
                (slot) =>
                    !slot.player &&
                    (positionMap[slot.position] || [slot.position]).includes(
                        playerObj.Pos
                    )
            );
            if (idx === -1) return curr;
            const next = [...curr];
            next[idx] = {
                ...next[idx],
                player: playerObj.Player,
                team: playerObj.Team,
                salary: playerObj.Salary ?? 0,
                fpts: playerObj.Fpts ?? 0,
                grade: playerObj.Grade ?? "",
            };
            return next;
        });
    }, [positionMap]);

    const playerColumns = useMemo(() => {
        if (!players.length) return [];

        return Object.keys(players[0]).map((key) => {
            // Player column with injury and news icons
            if (key === "Player") {
                return {
                    Header: key,
                    accessor: key,
                    sortable: true,
                    Cell: ({value, row}) => {
                        const nameKey = row.Player.trim().toLowerCase();
                        const isSelected = selectedNames.includes(row.Player);
                        return (
                            <div style={{display: "inline-flex", alignItems: "center"}}>
                              <span
                                  onClick={() => {
                                      if (!isSelected) addToLineup(row);
                                  }}
                                  className="clickable-name"
                                  style={{
                                      cursor: isSelected ? "not-allowed" : "pointer",
                                      opacity: isSelected ? 0.5 : 1,
                                  }}
                              >
                                {value}
                              </span>
                                {/* Tooltip Icons - isolate each with its own relative block container */}
                                <div style={{position: "relative", display: "inline-block"}}>
                                    {injuryMap[nameKey] && <InjuryTooltip details={injuryMap[nameKey]}/>}
                                </div>
                                <div style={{position: "relative", display: "inline-block"}}>
                                    {newsMap[nameKey] && <NewsTooltip details={newsMap[nameKey]}/>}
                                </div>
                            </div>
                        );
                    }
                };
            }

            // Team column with matchup tooltip
            if (key === "Team") {
                return {
                    Header: key,
                    accessor: key,
                    sortable: true,
                    Cell: ({value}) => {
                        if (!value) return value;
                        const matchup = matchupMap[value];
                        return (
                            <MatchupTooltip matchup={matchup}>
                                {value}
                            </MatchupTooltip>
                        );
                    }
                };
            }

            // Default column renderer
            return {
                Header: key,
                accessor: key,
                sortable: true
            };
        });
    }, [players, injuryMap, selectedNames, matchupMap, addToLineup, newsMap]);


    const lineupWithTotal = useMemo(() => {
        const totalSalary = lineup.reduce(
            (sum, slot) => sum + (slot.salary || 0),
            0
        );
        const totalFpts = lineup.reduce((sum, slot) => sum + (slot.fpts || 0), 0);
        return [
            ...lineup.map((slot, idx) => ({...slot, index: idx})),
            {
                position: "Total",
                player: "",
                team: "",
                salary: totalSalary,
                fpts: totalFpts,
                grade: "",
            },
        ];
    }, [lineup]);

    // Calculate lineupStatus for main Table styling (salary-exceeded, valid-lineup)
    const lineupStatus = useMemo(() => {
        const totalSalary = lineup.reduce(
            (sum, slot) => sum + (slot.salary || 0),
            0
        );
        const openSlots = lineup.filter((slot) => !slot.player).length;
        const remainingSalary = salaryCap - totalSalary;

        let status = "";
        if (remainingSalary < 0) {
            status = "salary-exceeded";
        } else if (openSlots === 0) {
            status = "valid-lineup";
        }
        
        console.log("Lineup Status:", status, 
            "openSlots:", openSlots, 
            "remainingSalary:", remainingSalary);
        
        return status; // Default: no specific border styling for the table
    }, [lineup, salaryCap]);

    // avgPerSlot is needed for Shortlist, so calculate it here or pass it down from LineupStats
    // For now, let's keep avgPerSlot calculation for Shortlist here to minimize changes to Shortlist props
    // Or, LineupStats could provide it via a render prop or context if it grew more complex.
    // Simpler for now: recalculate avgPerSlot specifically for Shortlist if not available otherwise.
    // Actually, Shortlist already receives avgPerSlot. This means the original useMemo needs to provide it.
    // Let's refine: the original useMemo can provide avgPerSlot, and LineupStats will also calculate it internally.
    // OR, App.jsx calculates all values needed by its direct children (Table, Shortlist),
    // and LineupStats calculates all values it needs for its own display. This is cleaner.

    const { avgPerSlot } = useMemo(() => {
         const totalSalary = lineup.reduce(
            (sum, slot) => sum + (slot.salary || 0),
            0
        );
        const open = lineup.filter((slot) => !slot.player).length;
        const remaining = salaryCap - totalSalary;
        return { 
            avgPerSlot: open > 0 ? remaining / open : 0,
        };
    }, [lineup, salaryCap]);


    const filteredSortedPlayers = useMemo(() => {
        let list = [...players];
        if (disabledPositions.length) {
            list = list.filter(
                (p) =>
                    !disabledPositions.some((slotPos) => {
                        const allowed = positionMap[slotPos] || [slotPos];
                        return allowed.includes(p.Pos);
                    })
            );
        }

        // Filter by maxSalary if provided
        if (maxSalary && !isNaN(maxSalary) && maxSalary > 0) {
            list = list.filter(p => p.Salary <= Number(maxSalary));
        }

        // Recalculate Overall if weightingFactor changes, directly on the current list
        // This is important if players state is not re-fetched but weightingFactor changes
        // However, the primary calculation is done on fetch. This ensures Overall updates if factor changes live.
        list = list.map(player => {
            const fptsGrade = player['Fpts Grade'];
            const valGrade = player['Val Grade'];
            let newOverall;
            if (typeof fptsGrade === 'number' && typeof valGrade === 'number') {
                newOverall = Math.round((fptsGrade * (1 - weightingFactor)) + (valGrade * weightingFactor));
            } else if (typeof player.Overall === 'number') {
                // If new calculation is not possible, but an old 'Overall' exists and is a number, round it.
                // This handles cases where 'Overall' might have been loaded with decimals from source,
                // or if fptsGrade/valGrade become invalid later.
                newOverall = Math.round(player.Overall);
            } else {
                // Default to 0 if no valid grades and no pre-existing valid Overall.
                newOverall = 0;
            }
            const newGrade = calculateGrade(newOverall);
            return { ...player, Overall: newOverall, Grade: newGrade };
        });

        if (sortKey) {
            list.sort((a, b) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];

                // Handle potential NaN or undefined values in sorting
                const aIsValid = typeof aVal === 'number' && !isNaN(aVal);
                const bIsValid = typeof bVal === 'number' && !isNaN(bVal);

                if (aIsValid && bIsValid) {
                    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
                    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
                } else if (aIsValid) {
                    return -1; // Valid numbers come before invalid/NaN
                } else if (bIsValid) {
                    return 1;  // Valid numbers come before invalid/NaN
                }
                // If both are invalid or equal, maintain order or consider them equal
                return 0;
            });
        }
        return list;
    }, [players, disabledPositions, sortKey, sortDir, positionMap, maxSalary, weightingFactor]); // Add weightingFactor to dependency array

    const togglePosition = (pos) => {
        setDisabledPositions((curr) =>
            curr.includes(pos) ? curr.filter((p) => p !== pos) : [...curr, pos]
        );
    };

    const handleSort = (accessor) => {
        if (sortKey === accessor) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(accessor);
            setSortDir("asc");
        }
    };

    if (!playerColumns.length || !lineup.length) {
        return <div id="loading">Loading…</div>;
    }

    return (
        <main>
            <h1>DFS Lineup Builder</h1>
            <div className="layout-container">
                <div className="layout-left">
                    <section> {/* My Lineup */}
                        <h2>My Lineup</h2>
                        <Table
                            columns={lineupColumns}
                            data={lineupWithTotal}
                            disabledRow={(row) => row.position === "Total"}
                            className={`lineup-table ${lineupStatus}`} // Add a base class and the status
                        />
                        <LineupStats lineup={lineup} salaryCap={salaryCap} />
                    </section>
                </div>
                <div className="layout-right">
                    <section> {/* Shortlist */}
                        <Shortlist
                            players={filteredSortedPlayers}
                            lineup={lineup}
                            positionMap={positionMap}
                            avgPerSlot={avgPerSlot}
                            addToLineup={addToLineup}
                            selectedNames={selectedNames}
                            sortKey={sortKey}
                            sortDir={sortDir}
                            onHeaderClick={handleSort}
                        />
                    </section>
                    
                    <hr className="section-divider"/>
                    
                    <section> {/* All Players */}
                        <h2>All Players</h2>
                        <div className="table-controls">
                            {positions.map((pos) => (
                        <button
                            key={pos}
                            className={
                                disabledPositions.includes(pos) ? "tab disabled" : "tab"
                            }
                            onClick={() => togglePosition(pos)}
                        >
                            {pos}
                        </button>
                    ))}
                    <div className="filter-input">
                        <label htmlFor="max-salary">Max Salary:</label>
                        <input
                            id="max-salary"
                            type="number"
                            placeholder="Enter max salary"
                            value={maxSalary}
                            onChange={(e) => setMaxSalary(e.target.value)}
                        />
                    </div>
                    <div className="filter-input" style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>Fpts</span>
                        <input
                            id="weighting-factor"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={weightingFactor}
                            onChange={(e) => setWeightingFactor(parseFloat(e.target.value))}
                            style={{ flexGrow: 1 }}
                        />
                        <span style={{ marginLeft: '8px' }}>Val</span>
                    </div>
                </div>
                <Table
                    columns={playerColumns}
                    data={filteredSortedPlayers}
                    onRowClick={addToLineup}
                    disabledRow={(player) =>
                        lineup.some((slot) => slot.player === player.Player) ||
                        !lineup.some(
                            (slot) =>
                                !slot.player &&
                                (positionMap[slot.position] || [slot.position]).includes(
                                    player.Pos
                                )
                        )
                    }
                    onHeaderClick={handleSort}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    selectedPlayers={selectedNames}
                    className={`players-table ${lineupStatus}`} // Add a base class and the status
                />
            </section>
        </main>
    );
}