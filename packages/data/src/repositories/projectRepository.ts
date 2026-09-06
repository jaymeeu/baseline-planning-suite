import type { Id, Project } from '@bps/domain';
import {
  storeCount,
  storeDelete,
  storeGet,
  storeGetAll,
  storePut,
} from './storeHelpers';
import type { ProjectRepository } from './types';

export function createProjectRepository(db: IDBDatabase): ProjectRepository {
  const storeName = 'projects';
  return {
    list: () => storeGetAll<Project>(db, storeName),
    get: (id: Id) => storeGet<Project>(db, storeName, id),
    upsert: (project: Project) => storePut(db, storeName, project),
    remove: (id: Id) => storeDelete(db, storeName, id),
    count: () => storeCount(db, storeName),
  };
}
