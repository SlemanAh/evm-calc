export function downloadCsv(latestResult) {
  if (!latestResult) return alert("Nothing to download!");

  const r = latestResult;
  const data = [
    ["Metric", "Value"],
    ["EV", r.earnedValue], ["CV", r.costVariance], ["SV", r.scheduleVariance],
    ["CPI", r.costPerformanceIndex], ["SPI", r.schedulePerformanceIndex],
    ["EAC", r.estimateAtCompletion], ["ETC", r.estimateToComplete],
    ["VAC", r.varianceAtCompletion], ["TCPI", r.toCompletePerformanceIndex]
  ];

  const csv = data.map(([name, val]) => {
    const v = Number.isFinite(val) ? val.toFixed(2) : "Infinity";
    return `${name},${v}`;
  }).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const link = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: "evm_results.csv"
  });
  link.click();
}