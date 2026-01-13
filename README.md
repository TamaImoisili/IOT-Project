# IOT-Project

Goal:

This demo project displays Raspberry Pi system metrics on a live dashboard. It pulls data from an API and renders charts, status, and a raw data log for quick monitoring.

API usage:

The frontend requests metrics from `/api/data` on a regular interval and on manual refresh. The backend reads from Supabase and returns the latest rows for the dashboard.
