# IOT-Project

Goal:

This demo project displays Raspberry Pi system metrics on a live dashboard. It pulls data from an API and renders charts, status, and a raw data log for quick monitoring.

API usage:

The frontend requests metrics from `/api/data` on a regular interval and on manual refresh. The backend reads from Supabase and returns the latest rows for the dashboard.

Local development:
1) Create `frontend/.env.local` with `VITE_API_URL=http://localhost:5050`
2) Start frontend: Cd into /frontend and `npm run dev`
3) Start backend: cd into backend `npm run dev`