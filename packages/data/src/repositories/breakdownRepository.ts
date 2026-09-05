import type { BreakdownItem, Id } from '@bps/domain';
import {
  storeCount,
  storeDelete,
  storeGet,
  storeGetAll,
  storeGetAllFromIndex,
  storePut,
} from './storeHelpers';
import type { BreakdownItemRepository } from './types';

export function createBreakdownItemRepository(
  db: IDBDatabase,
): BreakdownItemRepository {
  const storeName = 'breakdownItems';
  return {
    list: () => storeGetAll<BreakdownItem>(db, storeName),
    listByProject: (projectId: Id) =>
      storeGetAllFromIndex<BreakdownItem>(
        db,
        storeName,
        'byProjectId',
        projectId,
      ),
    get: (id: Id) => storeGet<BreakdownItem>(db, storeName, id),
    upsert: (item: BreakdownItem) => storePut(db, storeName, item),
    remove: (id: Id) => storeDelete(db, storeName, id),
    count: () => storeCount(db, storeName),
  };
}
