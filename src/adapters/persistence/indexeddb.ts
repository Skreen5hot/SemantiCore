import type { JsonLdNode } from "../../kernel/index.js";

interface IndexedDbFactoryLike {
  open(name: string, version?: number): IDBOpenRequestLike;
}

interface IDBOpenRequestLike {
  result: IDBDatabaseLike;
  error: unknown;
  onupgradeneeded: (() => void) | null;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

interface IDBDatabaseLike {
  objectStoreNames: { contains(name: string): boolean };
  createObjectStore(name: string): void;
  transaction(storeName: string, mode: "readonly" | "readwrite"): IDBTransactionLike;
  close(): void;
}

interface IDBTransactionLike {
  error: unknown;
  objectStore(name: string): IDBObjectStoreLike;
  oncomplete: (() => void) | null;
  onerror: (() => void) | null;
}

interface IDBObjectStoreLike {
  put(value: unknown, key: string): void;
  get(key: string): IDBRequestLike;
  delete(key: string): void;
}

interface IDBRequestLike {
  result: unknown;
  error: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
}

export interface IndexedDbStateAdapter {
  saveDocument(document: JsonLdNode): Promise<void>;
  loadDocument<T extends JsonLdNode = JsonLdNode>(id: string): Promise<T | null>;
  deleteDocument(id: string): Promise<void>;
}

const STORE_NAME = "documents";

export function createIndexedDbStateAdapter(
  indexedDBFactory: IndexedDbFactoryLike,
  databaseName = "semanticore-local-state",
): IndexedDbStateAdapter {
  async function open(): Promise<IDBDatabaseLike> {
    return new Promise((resolve, reject) => {
      const request = indexedDBFactory.open(databaseName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    async saveDocument(document: JsonLdNode): Promise<void> {
      if (!document["@id"]) {
        throw new Error("IndexedDB state documents must have stable @id values.");
      }
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(structuredClone(document), document["@id"] as string);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    },

    async loadDocument<T extends JsonLdNode = JsonLdNode>(id: string): Promise<T | null> {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).get(id);
        request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      });
    },

    async deleteDocument(id: string): Promise<void> {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    },
  };
}
