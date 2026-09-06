import type { Employee, Id } from '@bps/domain';
import {
  storeCount,
  storeDelete,
  storeGet,
  storeGetAll,
  storePut,
} from './storeHelpers';
import type { EmployeeRepository } from './types';

export function createEmployeeRepository(db: IDBDatabase): EmployeeRepository {
  const storeName = 'employees';
  return {
    list: () => storeGetAll<Employee>(db, storeName),
    get: (id: Id) => storeGet<Employee>(db, storeName, id),
    upsert: (employee: Employee) => storePut(db, storeName, employee),
    remove: (id: Id) => storeDelete(db, storeName, id),
    count: () => storeCount(db, storeName),
  };
}
