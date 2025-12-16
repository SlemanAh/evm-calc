export let database = null;

export const DB_NAME = "evc_db";
export const DB_VERSION = 1;
export const SNAPSHOT_STORE = "Snapshots";
export const APP_VERSION = "1.0.0";

export function openDatabase() {
  return new Promise((resolve, reject) => {
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
      resolve(database);
    };

    request.onerror = () => {
      alert("Database failed to open.");
      reject(new Error("Database failed to open."));
    };
  });
}