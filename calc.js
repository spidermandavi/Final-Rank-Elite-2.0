// calc.js
const Calc = {

  calculatePayouts(teamMembers, tournamentResults, ledger) {
    // Initialize player stats
    const players = {};
    teamMembers.forEach(u => {
      players[u] = {
        username: u,
        netWinsCM: 0,
        netWinsST: 0,
        earningsCM: 0,
        earningsST: 0,
        winrateCM: 0,
        winrateST: 0,
        totalEarnings: 0
      };
    });

    // Process each tournament
    tournamentResults.forEach(tmtObj => {
      const tmt = tmtObj.tournament;
      const type = tmt.name.toLowerCase().includes("chessmood") ? "chessMood" : "streamers";

      // Determine prize table
      let prizeTable = CONFIG.tournamentTypes[type].default.prizes;
      if (type === "chessMood" && tmt.name.toLowerCase().includes("december")) {
        prizeTable = CONFIG.tournamentTypes[type].december.prizes;
      }

      const prizeTotal = prizeTable.reduce((a,b)=>a+b,0);
      const playerPool = prizeTotal * (1 - CONFIG.leaderCut);

      // Only top 100 count
      const sortedResults = tmtObj.results
        .filter(r => teamMembers.includes(r.username))
        .sort((a,b) => b.points - a.points);

      // Calculate net wins and win rate per player
      sortedResults.forEach((r, idx) => {
        const wins = r.wins || 0;
        const losses = r.losses || 0;
        const netWins = wins - losses;
        const winrate = wins / Math.max(1, wins + losses);

        if (type === "chessMood") {
          players[r.username].netWinsCM += netWins;
          players[r.username].winrateCM = winrate;
        } else {
          players[r.username].netWinsST += netWins;
          players[r.username].winrateST = winrate;
        }
      });

      // Split playerPool by tier percentages
      const tiers = CONFIG.tiers.map(t => ({
        ...t,
        players: sortedResults.slice(t.maxRank - t.maxRank + 1 - 1, t.maxRank)
      }));

      // For simplicity in this skeleton, we assign earnings proportional to netWins
      sortedResults.forEach((r, idx) => {
        const effectiveNetWins = Math.max(0, r.wins - r.losses);
        const earning = playerPool * (effectiveNetWins / Math.max(1, sortedResults.reduce((sum,p)=>sum + Math.max(0,(p.wins - p.losses)),0)));
        if (type === "chessMood") players[r.username].earningsCM += Math.floor(earning*100)/100;
        else players[r.username].earningsST += Math.floor(earning*100)/100;
      });
    });

    // Final totals
    Object.values(players).forEach(p => {
      p.totalEarnings = p.earningsCM + p.earningsST;
    });

    // Return sorted by totalEarnings
    return Object.values(players).sort((a,b) => b.totalEarnings - a.totalEarnings);
  }
};
