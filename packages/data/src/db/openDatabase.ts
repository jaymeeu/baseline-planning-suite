import { requestToPromise, transactionDone } from './idbRequest';

export const PEOPLE_DB_NAME = 'bps-people';
export const DELIVERY_DB_NAME = 'bps-delivery';
export const DB_VERSION = 1;

export type PeopleStoreName = 'employees' | 'rates';
export type DeliveryStoreName = 'projects' | 'breakdownItems' | 'allocations';

function requireIndexedDb(): IDBFactory {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment');
  }
  return indexedDB;
}

async function clearStores(
  db: IDBDatabase,
  storeNames: readonly string[],
): Promise<void> {
  const tx = db.transaction([...storeNames], 'readwrite');
  for (const name of storeNames) {
    tx.objectStore(name).clear();
  }
  await transactionDone(tx);
}

export async function openPeopleDatabase(): Promise<IDBDatabase> {
  const factory = requireIndexedDb();
  const request = factory.open(PEOPLE_DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('employees')) {
      db.createObjectStore('employees', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('rates')) {
      const rates = db.createObjectStore('rates', { keyPath: 'id' });
      rates.createIndex('byEmployeeId', 'employeeId', { unique: false });
    }
  };
  return requestToPromise(request);
}

export async function openDeliveryDatabase(): Promise<IDBDatabase> {
  const factory = requireIndexedDb();
  const request = factory.open(DELIVERY_DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains('projects')) {
      db.createObjectStore('projects', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('breakdownItems')) {
      const items = db.createObjectStore('breakdownItems', { keyPath: 'id' });
      items.createIndex('byProjectId', 'projectId', { unique: false });
    }
    if (!db.objectStoreNames.contains('allocations')) {
      const allocations = db.createObjectStore('allocations', { keyPath: 'id' });
      allocations.createIndex('byEmployeeMonth', ['employeeId', 'month'], {
        unique: false,
      });
      allocations.createIndex('byBreakdownItemId', 'breakdownItemId', {
        unique: false,
      });
    }
  };
  return requestToPromise(request);
}

/** Empty People stores (avoids deleteDatabase hangs with open connections). */
export async function clearPeopleDatabase(): Promise<void> {
  const db = await openPeopleDatabase();
  await clearStores(db, ['employees', 'rates']);
  db.close();
}

/** Empty Delivery stores (avoids deleteDatabase hangs with open connections). */
export async function clearDeliveryDatabase(): Promise<void> {
  const db = await openDeliveryDatabase();
  await clearStores(db, ['projects', 'breakdownItems', 'allocations']);
  db.close();
}
