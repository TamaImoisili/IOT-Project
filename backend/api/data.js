require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function handler(req, res) {
	// Basic CORS for both Vercel and local
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
	res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version');

	if (req.method === 'OPTIONS') {
		res.status(200).end();
		return;
	}

	const limit = parseInt(req.query.limit || '100', 10);
	const { data, error } = await supabase
		.from('pi_metrics')
		.select('timestamp, device_id, cpu_load, cpu_temp, ram_usage_percent, disk_usage_percent, network_latency_ms')
		.order('timestamp', { ascending: false })
		.limit(limit);

	if (error) return res.status(500).json({ error: error.message });
	res.json({ data });
}

module.exports = handler;

// Allow running locally with `node api/data.js`
if (require.main === module) {
	const express = require('express');
	const cors = require('cors');
	const app = express();
	app.use(cors());
	app.use(express.json());
	app.get('/api/data', handler);
	const port = process.env.PORT || 5001;
	app.listen(port, () => console.log(`Local API listening on http://localhost:${port}`));
}
