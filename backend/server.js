require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.get('/api/data', async (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const { data, error } = await supabase
    .from('pi_metrics')
    .select('timestamp, device_id, cpu_load, cpu_temp, ram_usage_percent, disk_usage_percent, network_latency_ms')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on ${port}`));