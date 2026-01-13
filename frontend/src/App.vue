<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import axios from 'axios'
import MetricsChart from './components/MetricsChart.vue'

const rows = ref([])
const loading = ref(true)
const error = ref(null)
const liveUpdates = ref(true)
const lastFetchAt = ref(null)
let refreshTimer = null

async function fetchData() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050'
    const res = await axios.get(`${apiUrl}/api/data?limit=300`)
    console.log(res.data)
    rows.value = res.data?.data || []
    error.value = null
    lastFetchAt.value = Date.now()
  } catch (err) {
    error.value = `Error loading data: ${err.message}`
  } finally {
    loading.value = false
  }
}

function startLiveUpdates() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = setInterval(fetchData, 30000)
}

function stopLiveUpdates() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function toggleLiveUpdates() {
  liveUpdates.value = !liveUpdates.value
  if (liveUpdates.value) {
    fetchData()
    startLiveUpdates()
  } else {
    stopLiveUpdates()
  }
}

onMounted(() => {
  fetchData()
  startLiveUpdates()
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

const easternFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'short'
})

function formatEasternTimestamp(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return easternFormatter.format(date)
}

const latestRow = computed(() => rows.value[0] || null)
const isOnline = computed(() => {
  if (!liveUpdates.value) return false
  if (!lastFetchAt.value) return false
  return Date.now() - lastFetchAt.value <= 90 * 1000
})
const latestTimestamp = computed(() =>
  latestRow.value ? formatEasternTimestamp(latestRow.value.timestamp) : '—'
)
const latestRelative = computed(() => {
  if (!latestRow.value?.timestamp) return '—'
  const lastSeen = new Date(latestRow.value.timestamp).getTime()
  if (Number.isNaN(lastSeen)) return '—'
  const diffSeconds = Math.max(0, Math.round((Date.now() - lastSeen) / 1000))
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  return `${diffHours}h ago`
})

function averageFor(field) {
  if (!rows.value.length) return null
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  const lastDay = rows.value.filter((row) => new Date(row.timestamp).getTime() >= cutoff)
  const source = lastDay.length ? lastDay : rows.value
  const sum = source.reduce((acc, row) => acc + Number(row[field] || 0), 0)
  return sum / source.length
}

const avgCpuLoad = computed(() => averageFor('cpu_load'))
const avgCpuTemp = computed(() => averageFor('cpu_temp'))
const avgRamUsage = computed(() => averageFor('ram_usage_percent'))
const avgDiskUsage = computed(() => averageFor('disk_usage_percent'))

function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toFixed(digits)
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-icon" aria-hidden="true"></div>
        <div>
          <div class="brand-title">Raspberry Pi System Monitor</div>
        </div>
      </div>
      <div class="status">
        <div class="status-pill" :class="{ online: isOnline, offline: !isOnline }">
          <span class="dot"></span>
          {{ isOnline ? 'Online' : 'Offline' }}
        </div>
        <div class="status-meta">Last updated: {{ latestTimestamp }} ({{ latestRelative }})</div>
        <button class="ghost-btn refresh-btn" type="button" @click="fetchData">Refresh</button>
        <label class="switch" aria-label="Realtime updates">
          <input type="checkbox" :checked="liveUpdates" @change="toggleLiveUpdates" />
          <span class="slider"></span>
        </label>
      </div>
    </header>

    <section class="cards">
      <article class="stat-card amber">
        <div class="stat-title">CPU Temp</div>
        <div class="stat-value">
          {{ latestRow ? `${formatNumber(latestRow.cpu_temp)}°C` : '—' }}
        </div>
        <div class="stat-avg">24h avg {{ formatNumber(avgCpuTemp) }}°C</div>
        <div class="sparkline"></div>
      </article>
      <article class="stat-card blue">
        <div class="stat-title">CPU Load</div>
        <div class="stat-value">
          {{ latestRow ? `${formatNumber(latestRow.cpu_load)}%` : '—' }}
        </div>
        <div class="stat-avg">24h avg {{ formatNumber(avgCpuLoad) }}%</div>
        <div class="sparkline"></div>
      </article>
      <article class="stat-card purple">
        <div class="stat-title">RAM Usage</div>
        <div class="stat-value">
          {{ latestRow ? `${formatNumber(latestRow.ram_usage_percent)}%` : '—' }}
        </div>
        <div class="stat-avg">24h avg {{ formatNumber(avgRamUsage) }}%</div>
        <div class="sparkline"></div>
      </article>
      <article class="stat-card teal">
        <div class="stat-title">Disk Usage</div>
        <div class="stat-value">
          {{ latestRow ? `${formatNumber(latestRow.disk_usage_percent)}%` : '—' }}
        </div>
        <div class="stat-avg">24h avg {{ formatNumber(avgDiskUsage) }}%</div>
        <div class="sparkline"></div>
      </article>
    </section>

    <section class="main-grid">
      <div class="panel chart-panel">
        <div class="panel-header">
          <div class="panel-title">System Metrics History (Last 24 Hours)</div>
        </div>
        <MetricsChart :rows="rows" :loading="loading" :error="error" />
      </div>

      <section class="panel table-panel">
        <div class="panel-header">
          <div class="panel-title">Raw Data Log</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>CPU Load</th>
                <th>CPU Temp</th>
                <th>RAM Usage</th>
                <th>Disk Usage</th>
                <th>Network Latency</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6">Loading...</td>
              </tr>
              <tr v-else-if="error">
                <td colspan="6">{{ error }}</td>
              </tr>
              <tr v-else-if="!rows.length">
                <td colspan="6">No data yet.</td>
              </tr>
              <tr v-else v-for="row in rows.slice(0, 15)" :key="row.timestamp">
                <td>{{ formatEasternTimestamp(row.timestamp) }}</td>
                <td>{{ formatNumber(row.cpu_load) }}%</td>
                <td>{{ formatNumber(row.cpu_temp) }}°C</td>
                <td>{{ formatNumber(row.ram_usage_percent) }}%</td>
                <td>{{ formatNumber(row.disk_usage_percent) }}%</td>
                <td>{{ formatNumber(row.network_latency_ms) }} ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </div>
</template>
