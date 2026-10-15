/**
 * IndexedDB Full Backup System
 * - Export entire DB
 * - Import entire DB
 * - Safe for game saves / chat / quizzes
 */

export class IDBBackup {

  constructor(dbName) {
    this.dbName = dbName;
  }

  // -----------------------------
  // OPEN DATABASE
  // -----------------------------
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // -----------------------------
  // EXPORT ENTIRE DATABASE
  // -----------------------------
  async exportAll() {
    const db = await this.openDB();

    const exportData = {
      dbName: this.dbName,
      version: db.version,
      stores: {}
    };

    const storeNames = Array.from(db.objectStoreNames);

    for (const storeName of storeNames) {
      exportData.stores[storeName] = await this.exportStore(db, storeName);
    }

    db.close();
    return exportData;
  }

  async exportStore(db, storeName) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // -----------------------------
  // DOWNLOAD BACKUP FILE
  // -----------------------------
  async downloadBackup(filename = "idb-backup.json") {
    const data = await this.exportAll();

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  // -----------------------------
  // IMPORT BACKUP FILE
  // -----------------------------
  async importBackup(jsonData) {
    const db = await this.openDB();

    const storeNames = Object.keys(jsonData.stores);

    for (const storeName of storeNames) {
      if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`Store missing: ${storeName}`);
        continue;
      }

      await this.restoreStore(db, storeName, jsonData.stores[storeName]);
    }

    db.close();
  }

  async restoreStore(db, storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      store.clear();

      for (const item of data) {
        store.put(item);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // -----------------------------
  // FILE UPLOAD IMPORT
  // -----------------------------
  async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target.result);
          await this.importBackup(json);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(reader.error);

      reader.readAsText(file);
    });
  }
}
