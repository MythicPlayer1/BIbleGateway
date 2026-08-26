// High-Performance IndexedDB Storage for Large HD Backgrounds & Videos
// Bypasses the 5MB localStorage limit and supports multi-gigabyte video & photo assets seamlessly

const DB_NAME = 'WorshipMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_assets';

interface MediaRecord {
  id: string; // 'global_background' or schedule item id (e.g. 'item-12345')
  blob: Blob;
  fileName: string;
  fileType: 'video' | 'image';
  mime: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save Global Projector Background (supports multi-hundred MB HD videos & photos)
 */
export async function saveGlobalBackground(
  blob: Blob,
  fileName: string,
  fileType: 'video' | 'image',
  mime: string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: MediaRecord = {
      id: 'global_background',
      blob,
      fileName,
      fileType,
      mime,
      updatedAt: Date.now()
    };

    store.put(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save global background to IndexedDB:', err);
  }
}

/**
 * Load Global Projector Background
 */
export async function getGlobalBackground(): Promise<{
  blob: Blob;
  buffer: ArrayBuffer;
  fileName: string;
  fileType: 'video' | 'image';
  mime: string;
} | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('global_background');

    return new Promise((resolve, reject) => {
      req.onsuccess = async () => {
        const record = req.result as MediaRecord | undefined;
        if (!record || !record.blob) {
          resolve(null);
          return;
        }

        try {
          const buffer = await record.blob.arrayBuffer();
          resolve({
            blob: record.blob,
            buffer,
            fileName: record.fileName,
            fileType: record.fileType,
            mime: record.mime
          });
        } catch (e) {
          reject(e);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get global background from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete Global Projector Background
 */
export async function deleteGlobalBackground(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('global_background');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to delete global background from IndexedDB:', err);
  }
}

/**
 * Save Scheduled Media File (Video/Photo slide)
 */
export async function saveScheduleMedia(
  id: string,
  blob: Blob,
  fileName: string,
  fileType: 'video' | 'image',
  mime: string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: MediaRecord = {
      id,
      blob,
      fileName,
      fileType,
      mime,
      updatedAt: Date.now()
    };

    store.put(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error(`Failed to save schedule media [${id}] to IndexedDB:`, err);
  }
}

/**
 * Load Scheduled Media File by Item ID
 */
export async function getScheduleMedia(id: string): Promise<{
  blob: Blob;
  buffer: ArrayBuffer;
  fileName: string;
  fileType: 'video' | 'image';
  mime: string;
} | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    return new Promise((resolve, reject) => {
      req.onsuccess = async () => {
        const record = req.result as MediaRecord | undefined;
        if (!record || !record.blob) {
          resolve(null);
          return;
        }

        try {
          const buffer = await record.blob.arrayBuffer();
          resolve({
            blob: record.blob,
            buffer,
            fileName: record.fileName,
            fileType: record.fileType,
            mime: record.mime
          });
        } catch (e) {
          reject(e);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error(`Failed to get schedule media [${id}] from IndexedDB:`, err);
    return null;
  }
}

/**
 * Delete Scheduled Media File by Item ID
 */
export async function deleteScheduleMedia(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error(`Failed to delete schedule media [${id}] from IndexedDB:`, err);
  }
}

/**
 * Delete Multiple Scheduled Media Files
 */
export async function deleteMultipleScheduleMedia(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const id of ids) {
      store.delete(id);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to delete multiple schedule media from IndexedDB:', err);
  }
}
