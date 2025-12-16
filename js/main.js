import { ui } from './ui.js';
import { openDatabase } from './db/DatabaseManager.js';
import { calculate } from './evm/Calculator.js';
import { displayResults } from './evm/ResultsView.js';
import { clearFields, saveSnapshot, loadHistory, restoreSnapshot, deleteSnapshot, setLatestResult, setDisplayResultsCallback } from './snapshots/SnapshotService.js';
import { downloadCsv } from './export/CsvExporter.js';

let latestResult = null;

setDisplayResultsCallback(displayResults);

openDatabase().then(() => {
  loadHistory();
});

// Help drawer
const toggleHelp = () => {
  ui.helpDrawer.style.display = ui.helpDrawer.style.display === "block" ? "none" : "block";
};
ui.helpBtn.addEventListener("click", toggleHelp);

// For HTML onclick
window.calculate = () => {
  const result = calculate(ui.bac, ui.pv, ui.ev, ui.ac, ui.eacModel.value);
  if (result) {
    latestResult = result;
    setLatestResult(result);
    displayResults(result);
  }
};
window.clearFields = clearFields;
window.saveSnapshot = saveSnapshot;
window.downloadCsv = () => downloadCsv(latestResult);
window.loadHistory = loadHistory;
window.toggleHelp = toggleHelp;
window.restoreSnapshot = restoreSnapshot;
window.deleteSnapshot = deleteSnapshot;