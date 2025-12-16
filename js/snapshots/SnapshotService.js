import { ui } from '../ui.js';
import { database, SNAPSHOT_STORE, APP_VERSION } from '../db/DatabaseManager.js';
import { readNumber } from '../evm/Calculator.js';

let latestResult = null;
let displayResultsCallback = null;

export function setLatestResult(result) {
  latestResult = result;
}

export function setDisplayResultsCallback(callback) {
  displayResultsCallback = callback;
}

export function clearFields() {
  ["bac", "pv", "ev", "ac", "statusDate", "notes"].forEach(id => ui[id].value = "");
  ui.resultsGrid.innerHTML = "";
  latestResult = null;
}

export function saveSnapshot() {
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

export function loadHistory() {
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

export function restoreSnapshot(id) {
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
    if (latestResult && displayResultsCallback) displayResultsCallback(latestResult);
  };
}

export function deleteSnapshot(id) {
  if (!database) return;
  const tx = database.transaction(SNAPSHOT_STORE, "readwrite");
  tx.objectStore(SNAPSHOT_STORE).delete(id);
  tx.oncomplete = loadHistory;
}