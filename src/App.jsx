import React, {useEffect, useMemo, useState, useCallback} from "react";
import Table from "./components/table";
import InjuryTooltip from "./components/./InjuryTooltip.jsx";
import MatchupTooltip from "./components/MatchupTooltip.jsx";

const DATA_URL =
    "https://script.google.com/macros/s/AKfycbzODSyKW5YZpujVWZMr8EQkpMKRwaKPI_lYiAv2mxDe-dCr9LRfEjt8-wzqBB_X4QKxug/exec";

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
    const [injuryMap, setInjuryMap] = useState({});
    const [matchupMap, setMatchupMap] = useState({});

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
            {
                Header: "Team", 
                accessor: "team",
                Cell: ({value}) => {
                    if (!value) return value;
                    const matchup = matchupMap[value];
                    return (
                        <MatchupTooltip matchup={matchup}>
                            {value}
                        </MatchupTooltip>
                    );
                }
            },
            {Header: "Salary", accessor: "salary"},
            {Header: "Fpts", accessor: "fpts"},
            {Header: "Grade", accessor: "grade"},
        ];
    }, [matchupMap, removeFromLineup]);

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
                const map = {};
                injuries.forEach((inj) => {
                    if (inj.Name) {
                        const key = inj.Name.trim().toLowerCase();
                        map[key] = `${inj.Inury || "Injury"} — ${
                            inj.Status || "Status unknown"
                        }`;
                    }
                });
                setInjuryMap(map);
                setPlayers(data.Players);

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
            // Player column with injury icon
            if (key === "Player") {
                return {
                    Header: key,
                    accessor: key,
                    sortable: true,
                    Cell: ({value, row}) => {
                        const nameKey = row.Player.trim().toLowerCase();
                        const isSelected = selectedNames.includes(row.Player);
                        return (
                            <>
                                <span
                                    onClick={() => {
                                        if (!isSelected) addToLineup(row);
                                    }}
                                    style={{
                                        cursor: isSelected ? "not-allowed" : "pointer",
                                        opacity: isSelected ? 0.5 : 1,
                                    }}
                                >
                                    {value}
                                </span>
                                {injuryMap[nameKey] && (
                                    <InjuryTooltip details={injuryMap[nameKey]}/>
                                )}
                            </>
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
    }, [players, injuryMap, selectedNames, matchupMap, addToLineup]);

    
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
    
    const {remainingSalary, openSlots, avgPerSlot, lineupStatus} = useMemo(() => {
        const totalSalary = lineup.reduce(
            (sum, slot) => sum + (slot.salary || 0),
            0
        );
        const open = lineup.filter((slot) => !slot.player).length;
        const remaining = salaryCap - totalSalary;
        const avg = open > 0 ? remaining / open : 0;
        
        // Determine lineup status for styling
        let status = "";
        if (remaining < 0) {
            status = "salary-exceeded";
        } else if (open === 0) {
            status = "valid-lineup";
        }
        
        return {
            remainingSalary: remaining, 
            openSlots: open, 
            avgPerSlot: avg,
            lineupStatus: status
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
        
        if (sortKey) {
            list.sort((a, b) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];
                if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
                if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
                return 0;
            });
        }
        return list;
    }, [players, disabledPositions, sortKey, sortDir, positionMap, maxSalary]);
    
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

            <section>
                <h2>My Lineup</h2>
                <Table
                    columns={lineupColumns}
                    data={lineupWithTotal}
                    disabledRow={(row) => row.position === "Total"}
                    className={lineupStatus}
                />
                <div className="lineup-stats">
                    <p className={remainingSalary < 0 ? "negative-salary" : (lineupStatus === "valid-lineup" ? "valid-salary" : "")}>
                        Remaining Salary:{" "}
                        {remainingSalary.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                        })}
                    </p>
                    <p className={remainingSalary < 0 ? "negative-salary" : (lineupStatus === "valid-lineup" ? "valid-salary" : "")}>
                        Average per Slot:{" "}
                        {avgPerSlot.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 0,
                        })}{" "}
                        {openSlots > 0 && `(across ${openSlots} slots)`}
                    </p>
                </div>
            </section>

                            <hr className="section-divider" />
                
            <section>
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
                    className={lineupStatus}
                />
            </section>
        </main>
    );
}