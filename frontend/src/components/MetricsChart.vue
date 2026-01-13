<template>
  <div class="chart-container">
    <div class="chart-meta">
      Safe ranges: CPU Load 0–80% · RAM 0–85% · CPU Temp 35–80°C
    </div>
    <div v-if="loading" class="loading">Loading data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="chart-body">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount, nextTick, watch, toRefs } from 'vue';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

const props = defineProps({
  rows: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
});
const { loading, error } = toRefs(props);

const canvas = ref(null);
const metrics = [
  { key: 'cpu_load', label: 'CPU Load', color: 'rgba(255, 99, 132, 1)', min: 0, max: 80 },
  { key: 'ram_usage_percent', label: 'RAM Usage', color: 'rgba(54, 162, 235, 1)', min: 0, max: 85 },
  { key: 'cpu_temp', label: 'CPU Temp', color: 'rgba(255, 159, 64, 1)', min: 35, max: 80 }
];
let chartInstance = null;

function normalizeToRange(value, min, max) {
  if (!Number.isFinite(value)) return null;
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return null;
  const raw = ((value - min) / span) * 100;
  return Math.min(100, Math.max(0, raw));
}

async function renderChart() {
  if (!props.rows.length) return;
  try {
    // Reverse to show oldest first
    const reversed = props.rows.slice().reverse();
    const labels = reversed.map(r => new Date(r.timestamp).toLocaleString());
    const series = metrics.reduce((acc, metric) => {
      acc[metric.key] = reversed.map(r =>
        normalizeToRange(Number(r[metric.key]), metric.min, metric.max)
      );
      return acc;
    }, {});

    await nextTick();
    if (!canvas.value) {
      throw new Error('Chart canvas not available');
    }
    const hiddenMetrics = new Set();
    if (chartInstance) {
      chartInstance.data.datasets.forEach((dataset, index) => {
        if (!chartInstance.isDatasetVisible(index)) {
          hiddenMetrics.add(dataset.label);
        }
      });
      chartInstance.destroy();
    }

    const datasets = metrics.map((metric) => ({
      label: `${metric.label} (% of safe range)`,
      data: series[metric.key],
      borderColor: metric.color,
      backgroundColor: metric.color.replace('1)', '0.1)'),
      fill: true,
      tension: 0.3,
      hidden: hiddenMetrics.has(metric.label)
    }));

    chartInstance = new Chart(canvas.value.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'rgba(238, 241, 245, 0.75)',
              usePointStyle: true,
              pointStyle: 'rectRounded',
              boxWidth: 28,
              boxHeight: 10,
              generateLabels(chart) {
                const base = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                return base.map((item) => {
                  const dataset = chart.data.datasets[item.datasetIndex];
                  const color = dataset?.borderColor || item.strokeStyle;
                  const isHidden = !chart.isDatasetVisible(item.datasetIndex);
                  return {
                    ...item,
                    strokeStyle: color,
                    lineWidth: isHidden ? 2 : 0,
                    fillStyle: isHidden ? 'rgba(0, 0, 0, 0)' : color
                  };
                });
              }
            }
          },
          title: {
            display: true,
            text: 'System Stress (% of Safe Range)',
            color: 'rgba(238, 241, 245, 0.8)'
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { color: 'rgba(238, 241, 245, 0.7)' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            title: { display: true, text: '% of Safe Range' }
          },
          x: {
            ticks: { color: 'rgba(238, 241, 245, 0.7)' },
            grid: { color: 'rgba(255, 255, 255, 0.04)' }
          }
        }
      }
    });

  } catch (err) {
    console.error(err);
  }
}

onMounted(renderChart);
watch(
  () => props.rows,
  () => renderChart(),
  { deep: true }
);
onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-meta {
  margin-bottom: 10px;
  color: rgba(238, 241, 245, 0.65);
  font-size: 0.85rem;
  text-align: center;
}

.chart-body {
  flex: 1;
  min-height: 0;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.loading,
.error {
  text-align: center;
  font-size: 18px;
  padding: 40px;
}

.error {
  color: #ff7a7a;
}
</style>
