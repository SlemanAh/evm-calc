let database = null;
let latestResult = null;

const DB_NAME = "evc_db";
const DB_VERSION = 1;
const SNAPSHOT_STORE = "Snapshots";
const APP_VERSION = "1.0.0";

// --- DOM helpers ---
const $ = (id) => document.getElementById(id);
const ui = {
  bac: $("bac"), pv: $("pv"), ev: $("ev"), ac: $("ac"),
  statusDate: $("statusDate"), unit: $("unit"), notes: $("notes"),
  eacModel: $("eacModel"), resultsGrid: $("resultsGrid"),
  historyTable: $("historyTable"), helpDrawer: $("helpDrawer"),
  helpBtn: $("helpBtn")
};

// --- DB ---
function openDatabase() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
      db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" })
        .createIndex("by_createdAt", "createdAt");
    }
  };

  request.onsuccess = (e) => {
    database = e.target.result;
    loadHistory();
  };

  request.onerror = () => alert("Database failed to open.");
}
openDatabase();

// --- Calculations ---
const readNumber = (el) => {
  const v = parseFloat(el.value);
  return Number.isFinite(v) ? v : null;
};

function calculate() {
  const bac = readNumber(ui.bac);
  const pv = readNumber(ui.pv);
  const ev = readNumber(ui.ev);
  const ac = readNumber(ui.ac);

  if ([bac, pv, ev, ac].some(v => v === null)) {
    return alert("Please fill all numeric fields.");
  }

  const cv = ev - ac;
  const sv = ev - pv;
  const cpi = ac === 0 ? 0 : ev / ac;
  const spi = pv === 0 ? 0 : ev / pv;

  let eac = bac;
  const model = ui.eacModel.value;
  if (model === "EAC_AC_plus_BAC_minus_EV") {
    eac = ac + (bac - ev);
  } else if (model === "EAC_BAC_over_CPI") {
    eac = cpi ? bac / cpi : Infinity;
  } else if (model === "EAC_BAC_over_CPIxSPI") {
    const cpiSpi = cpi * spi;
    eac = cpiSpi ? bac / cpiSpi : Infinity;
  }

  const etc = eac - ac;
  const vac = bac - eac;
  const tcpi = (eac - ac) === 0 ? Infinity : (bac - ev) / (eac - ac);

  latestResult = { earnedValue: ev, costVariance: cv, scheduleVariance: sv, 
    costPerformanceIndex: cpi, schedulePerformanceIndex: spi, 
    estimateAtCompletion: eac, estimateToComplete: etc, 
    varianceAtCompletion: vac, toCompletePerformanceIndex: tcpi };

  displayResults(latestResult);
}

const metricClass = (name, val) => {
  if (name === "costPerformanceIndex" || name === "schedulePerformanceIndex") {
    return val >= 1 ? "good" : val >= 0.9 ? "watch" : "poor";
  }
  if (name === "varianceAtCompletion") return val >= 0 ? "good" : "poor";
  return "";
};

function displayResults(r) {
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

// --- Actions ---
function clearFields() {
  ["bac", "pv", "ev", "ac", "statusDate", "notes"].forEach(id => ui[id].value = "");
  ui.resultsGrid.innerHTML = "";
  latestResult = null;
}

function saveSnapshot() {
  if (!database) return alert("Database not ready yet.");
  if (!latestResult) return alert("Calculate first!");

  const snapshot = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input: {
      bac: readNumber(ui.bac), pv: readNumber(ui.pv),
      ev: readNumber(ui.ev), ac: readNumber(ui.ac),
      statusDate: ui.statusDate.value, unit: ui.unit.value,
      notes: ui.notes.value, eacModel: ui.eacModel.value
    },
    result: latestResult,
    appVersion: APP_VERSION
  };

  const tx = database.transaction(SNAPSHOT_STORE, "readwrite");
  tx.objectStore(SNAPSHOT_STORE).put(snapshot);
  tx.oncomplete = () => { alert("Snapshot saved!"); loadHistory(); };
  tx.onerror = () => alert("Failed to save snapshot.");
}

function loadHistory() {
  if (!database) return;

  ui.historyTable.innerHTML = "<tr><th>Date</th><th>EV</th><th>Actions</th></tr>";

  const tx = database.transaction(SNAPSHOT_STORE, "readonly");
  const req = tx.objectStore(SNAPSHOT_STORE).index("by_createdAt").openCursor(null, "prev");

  req.onsuccess = (e) => {
    const cursor = e.target.result;
    if (!cursor) return;

    const s = cursor.value;
    const date = s.createdAt.split("T")[0];
    const ev = s.result?.earnedValue;
    const val = Number.isFinite(ev) ? ev.toFixed(2) : "-";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${date}</td>
      <td>${val}</td>
      <td>
        <button onclick="restoreSnapshot('${s.id}')">Restore</button>
        <button onclick="deleteSnapshot('${s.id}')">Delete</button>
      </td>
    `;
    ui.historyTable.appendChild(row);
    cursor.continue();
  };
}

function restoreSnapshot(id) {
  if (!database) return;

  const tx = database.transaction(SNAPSHOT_STORE, "readonly");
  tx.objectStore(SNAPSHOT_STORE).get(id).onsuccess = (e) => {
    const s = e.target.result;
    if (!s) return;

    ui.bac.value = s.input.bac ?? "";
    ui.pv.value = s.input.pv ?? "";
    ui.ev.value = s.input.ev ?? "";
    ui.ac.value = s.input.ac ?? "";
    ui.statusDate.value = s.input.statusDate ?? "";
    ui.unit.value = s.input.unit ?? "USD";
    ui.notes.value = s.input.notes ?? "";
    ui.eacModel.value = s.input.eacModel ?? "EAC_AC_plus_BAC_minus_EV";

    latestResult = s.result || null;
    if (latestResult) displayResults(latestResult);
  };
}

function deleteSnapshot(id) {
  if (!database) return;
  const tx = database.transaction(SNAPSHOT_STORE, "readwrite");
  tx.objectStore(SNAPSHOT_STORE).delete(id);
  tx.oncomplete = loadHistory;
}

function downloadCsv() {
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

// --- Help drawer ---
const toggleHelp = () => {
  ui.helpDrawer.style.display = ui.helpDrawer.style.display === "block" ? "none" : "block";
};
ui.helpBtn.addEventListener("click", toggleHelp);