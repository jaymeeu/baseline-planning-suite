import { requestToPromise, transactionDone } from '../db/idbRequest';

export async function storeCount(
  db: IDBDatabase,
  storeName: string,
): Promise<number> {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const count = await requestToPromise(store.count());
  await transactionDone(tx);
  return count;
}

export async function storeGetAll<T>(
  db: IDBDatabase,
  storeName: string,
): Promise<T[]> {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const rows = await requestToPromise(store.getAll());
  await transactionDone(tx);
  return rows as T[];
}

export async function storeGet<T>(
  db: IDBDatabase,
  storeName: string,
  id: string,
): Promise<T | undefined> {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const row = await requestToPromise(store.get(id));
  await transactionDone(tx);
  return row as T | undefined;
}

export async function storePut(
  db: IDBDatabase,
  storeName: string,
  value: unknown,
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.put(value);
  await transactionDone(tx);
}

export async function storeDelete(
  db: IDBDatabase,
  storeName: string,
  id: string,
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  store.delete(id);
  await transactionDone(tx);
}

export async function storeGetAllFromIndex<T>(
  db: IDBDatabase,
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange,
): Promise<T[]> {
  const tx = db.transaction(storeName, 'readonly');
  const index = tx.objectStore(storeName).index(indexName);
  const rows = await requestToPromise(index.getAll(query));
  await transactionDone(tx);
  return rows as T[];
}

export async function storeClear(
  db: IDBDatabase,
  storeName: string,
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  await transactionDone(tx);
}

export async function storePutAll(
  db: IDBDatabase,
  storeName: string,
  values: readonly unknown[],
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const value of values) {
    store.put(value);
  }
  await transactionDone(tx);
}
