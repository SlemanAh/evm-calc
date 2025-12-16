import { ui } from '../ui.js';

const metricClass = (name, val) => {
  if (name === "costPerformanceIndex" || name === "schedulePerformanceIndex") {
    return val >= 1 ? "good" : val >= 0.9 ? "watch" : "poor";
  }
  if (name === "varianceAtCompletion") return val >= 0 ? "good" : "poor";
  return "";
};

export function displayResults(r) {
  const metrics = [
    ["EV", r.earnedValue, ""],
    ["CV", r.costVariance, ""],
    ["SV", r.scheduleVariance, ""],
    ["CPI", r.costPerformanceIndex, "costPerformanceIndex"],
    ["SPI", r.schedulePerformanceIndex, "schedulePerformanceIndex"],
    ["EAC", r.estimateAtCompletion, ""],
    ["ETC", r.estimateToComplete, ""],
    ["VAC", r.varianceAtCompletion, "varianceAtCompletion"],
    ["TCPI", r.toCompletePerformanceIndex, ""]
  ];

  ui.resultsGrid.innerHTML = metrics.map(([label, val, key]) => {
    const cls = key ? metricClass(key, val) : "";
    const v = Number.isFinite(val) ? val.toFixed(2) : "∞";
    return `<div class="result-item ${cls}">${label}: ${v}</div>`;
  }).join("");
}