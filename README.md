# IOT-Project

Goal:

This demo project displays metrics from my personal Raspberry Pi system on a live dashboard. It obtains the data from the system in a python script then in this same script it sends that data to supabase. This script is designed and set to run as a service so it continuosly post updated data to supabase.

API usage:

The frontend requests metrics from `/api/data` on a regular interval and on manual refresh from my backend hosted on vercel. The backend makes a get request to supabase and sends this data back to the front end to be displayed.

Frameworks used:
Frontend: vue.
Backend: Express.js.

Local development:
1) Create `frontend/.env.local` with `VITE_API_URL=http://localhost:5050`
2) Start frontend: Cd into /frontend and `npm run dev`
3) Start backend: cd into backend `npm run dev`
