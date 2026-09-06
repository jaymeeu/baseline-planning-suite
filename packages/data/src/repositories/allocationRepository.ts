import type { CapacityAllocation, Id, YearMonth } from '@bps/domain';
import {
  storeCount,
  storeDelete,
  storeGet,
  storeGetAll,
  storeGetAllFromIndex,
  storePut,
} from './storeHelpers';
import type { AllocationRepository } from './types';

export function createAllocationRepository(
  db: IDBDatabase,
): AllocationRepository {
  const storeName = 'allocations';
  return {
    list: () => storeGetAll<CapacityAllocation>(db, storeName),
    listByEmployeeMonth: (employeeId: Id, month: YearMonth) =>
      storeGetAllFromIndex<CapacityAllocation>(
        db,
        storeName,
        'byEmployeeMonth',
        [employeeId, month],
      ),
    listByBreakdownItemId: (breakdownItemId: Id) =>
      storeGetAllFromIndex<CapacityAllocation>(
        db,
        storeName,
        'byBreakdownItemId',
        breakdownItemId,
      ),
    get: (id: Id) => storeGet<CapacityAllocation>(db, storeName, id),
    upsert: async (allocation: CapacityAllocation) => {
      const withTimestamp: CapacityAllocation = {
        ...allocation,
        updatedAt: allocation.updatedAt || new Date().toISOString(),
      };
      await storePut(db, storeName, withTimestamp);
    },
    remove: (id: Id) => storeDelete(db, storeName, id),
    count: () => storeCount(db, storeName),
  };
}
