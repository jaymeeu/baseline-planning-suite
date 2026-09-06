import type { Id, RateRecord } from '@bps/domain';
import {
  storeCount,
  storeDelete,
  storeGet,
  storeGetAll,
  storeGetAllFromIndex,
  storePut,
} from './storeHelpers';
import type { RateRepository } from './types';

export function createRateRepository(db: IDBDatabase): RateRepository {
  const storeName = 'rates';
  return {
    list: () => storeGetAll<RateRecord>(db, storeName),
    listByEmployee: (employeeId: Id) =>
      storeGetAllFromIndex<RateRecord>(db, storeName, 'byEmployeeId', employeeId),
    get: (id: Id) => storeGet<RateRecord>(db, storeName, id),
    upsert: (rate: RateRecord) => storePut(db, storeName, rate),
    remove: (id: Id) => storeDelete(db, storeName, id),
    count: () => storeCount(db, storeName),
  };
}
