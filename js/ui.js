export const $ = (id) => document.getElementById(id);

export const ui = {
  bac: $("bac"), pv: $("pv"), ev: $("ev"), ac: $("ac"),
  statusDate: $("statusDate"), unit: $("unit"), notes: $("notes"),
  eacModel: $("eacModel"), resultsGrid: $("resultsGrid"),
  historyTable: $("historyTable"), helpDrawer: $("helpDrawer"),
  helpBtn: $("helpBtn")
};