import type { BreakdownItem, CapacityAllocation, Employee, Id, Project, RateRecord, YearMonth } from '@bps/domain';
export interface EmployeeRepository {
    list(): Promise<Employee[]>;
    get(id: Id): Promise<Employee | undefined>;
    upsert(employee: Employee): Promise<void>;
    remove(id: Id): Promise<void>;
    count(): Promise<number>;
}
export interface RateRepository {
    list(): Promise<RateRecord[]>;
    listByEmployee(employeeId: Id): Promise<RateRecord[]>;
    get(id: Id): Promise<RateRecord | undefined>;
    upsert(rate: RateRecord): Promise<void>;
    remove(id: Id): Promise<void>;
    count(): Promise<number>;
}
export interface ProjectRepository {
    list(): Promise<Project[]>;
    get(id: Id): Promise<Project | undefined>;
    upsert(project: Project): Promise<void>;
    remove(id: Id): Promise<void>;
    count(): Promise<number>;
}
export interface BreakdownItemRepository {
    list(): Promise<BreakdownItem[]>;
    listByProject(projectId: Id): Promise<BreakdownItem[]>;
    get(id: Id): Promise<BreakdownItem | undefined>;
    upsert(item: BreakdownItem): Promise<void>;
    remove(id: Id): Promise<void>;
    count(): Promise<number>;
}
export interface AllocationRepository {
    list(): Promise<CapacityAllocation[]>;
    listByEmployeeMonth(employeeId: Id, month: YearMonth): Promise<CapacityAllocation[]>;
    listByBreakdownItemId(breakdownItemId: Id): Promise<CapacityAllocation[]>;
    get(id: Id): Promise<CapacityAllocation | undefined>;
    upsert(allocation: CapacityAllocation): Promise<void>;
    remove(id: Id): Promise<void>;
    count(): Promise<number>;
}
export interface PeopleRepositories {
    employees: EmployeeRepository;
    rates: RateRepository;
}
export interface DeliveryRepositories {
    projects: ProjectRepository;
    breakdownItems: BreakdownItemRepository;
    allocations: AllocationRepository;
}
