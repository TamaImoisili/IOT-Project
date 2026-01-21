# IOT-Project

Goal:

This demo project displays metrics from my personal Raspberry Pi system on a live dashboard. It sends this data to supabase using python and supabase's 

Tech stack:
- Frontend: Vue 3 + Vite
- UI/data: Chart.js + vue-chartjs, Axios
- Backend: Node.js + Express
- Data platform: Supabase (Postgres) via supabase-js
- Dev tooling: Nodemon, Docker Compose

API usage:

The frontend requests metrics from `/api/data` on a regular interval and on manual refresh. The backend reads from Supabase and returns the latest rows for the dashboard.

Local development:
1) Create `frontend/.env.local` with `VITE_API_URL=http://localhost:5050`
2) Start frontend: Cd into /frontend and `npm run dev`
3) Start backend: cd into backend `npm run dev`
