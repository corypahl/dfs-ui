# DFS Lineup Builder

A React + Vite web app for building Daily Fantasy Sports lineups. Pulls player data from a Google Sheets backend and lets users sort, filter, and construct valid lineups based on position rules and salary cap.

🌐 **Live Site**: [https://corypahl.github.io/dfs-ui](https://corypahl.github.io/dfs-ui)

---

## Features

- 🧩 Custom table for interactive lineup building
- 🔍 Position filtering and sorting
- ➕ Add/remove players with click
- 💵 Salary cap tracking and remaining value calc
- ✨ Visual indicators for selected players
- 🚀 Fast build with Vite + React
- 📡 Live Google Sheets integration

---

## 🔧 NPM Lifecycle Commands

These are the core `npm` scripts used for working with the project:

| Command             | Description                                              |
|---------------------|----------------------------------------------------------|
| `npm install`       | Install all dependencies                                 |
| `npm run dev`       | Start local dev server at `localhost:5173`              |
| `npm run build`     | Generate production-ready `dist/` folder                 |
| `npm run preview`   | Serve the last build locally (mimics GitHub Pages)       |
| `npm run deploy`    | Deploy `dist/` to GitHub Pages (`gh-pages` branch)       |

To test a production build locally:

```bash
npm run build && npm run preview
