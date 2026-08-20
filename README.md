# USD Intelligence

USD fundamental market-intelligence dashboard.

## Project layout

- `frontend/` — React/Vite dashboard and GitHub Pages deployment.
- `server/` — Express API that collects and analyzes FRED, BLS, Federal Reserve, news and geopolitical data.

## Local development

1. Copy `server/.env.example` to `server/.env`.
2. Put your FRED API key in `server/.env`.
3. From `frontend/`, run:

```bash
npm install
npm run dev
```

This starts both:
- React/Vite: `http://localhost:5173`
- Express API: `http://localhost:3001`

## Production

GitHub Pages hosts the frontend only. The Express server must be deployed to a Node host such as Render.

After deploying the server, set the GitHub repository variable `VITE_API_URL` to the deployed API URL.

Do not commit `server/.env` or expose your FRED API key.
