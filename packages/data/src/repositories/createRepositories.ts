import {
  openDeliveryDatabase,
  openPeopleDatabase,
} from '../db/openDatabase';
import { createAllocationRepository } from './allocationRepository';
import { createBreakdownItemRepository } from './breakdownRepository';
import { createEmployeeRepository } from './employeeRepository';
import { createProjectRepository } from './projectRepository';
import { createRateRepository } from './rateRepository';
import type { DeliveryRepositories, PeopleRepositories } from './types';

export async function createPeopleRepositories(): Promise<PeopleRepositories> {
  const db = await openPeopleDatabase();
  return {
    employees: createEmployeeRepository(db),
    rates: createRateRepository(db),
  };
}

export async function createDeliveryRepositories(): Promise<DeliveryRepositories> {
  const db = await openDeliveryDatabase();
  return {
    projects: createProjectRepository(db),
    breakdownItems: createBreakdownItemRepository(db),
    allocations: createAllocationRepository(db),
  };
}
