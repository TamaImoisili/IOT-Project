<template>
  <div class="chart-container">
    <h1>IoT Dashboard</h1>
    <div v-if="loading" class="loading">Loading data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <canvas v-else ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import axios from 'axios';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

const canvas = ref(null);
const loading = ref(true);
const error = ref(null);
let chartInstance = null;

async function loadData() {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await axios.get(`${apiUrl}/api/data?limit=100`);
    const rows = res.data?.data || [];

    if (rows.length === 0) {
      error.value = 'No data available';
      loading.value = false;
      return;
    }

    // Reverse to show oldest first
    const reversed = rows.slice().reverse();
    const labels = reversed.map(r => new Date(r.timestamp).toLocaleString());
    const cpuLoadData = reversed.map(r => Number(r.cpu_load));
    const cpuTempData = reversed.map(r => Number(r.cpu_temp));
    const ramUsageData = reversed.map(r => Number(r.ram_usage_percent));

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(canvas.value.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'CPU Load (%)',
            data: cpuLoadData,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'CPU Temp (°C)',
            data: cpuTempData,
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y1'
          },
          {
            label: 'RAM Usage (%)',
            data: ramUsageData,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Raspberry Pi Metrics' }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'CPU Load (%)' },
            min: 0,
            max: 100
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'CPU Temp (°C)' },
            grid: { drawOnChartArea: false }
          },
          y2: {
            type: 'linear',
            display: true,
            position: 'far-right',
            title: { display: true, text: 'RAM Usage (%)' },
            grid: { drawOnChartArea: false },
            offset: true
          }
        }
      }
    });

    loading.value = false;
  } catch (err) {
    error.value = `Error loading data: ${err.message}`;
    loading.value = false;
  }
}

onMounted(loadData);
onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

canvas {
  width: 100%;
  height: 500px;
  display: block;
  margin-bottom: 20px;
}

.loading,
.error {
  text-align: center;
  font-size: 18px;
  padding: 40px;
}

.error {
  color: red;
}
</style>
