import { describe, expect, it } from 'vitest';
import type { Employee } from '../../packages/domain/src/index';
import { filterEmployees } from '../../apps/people/src/peopleHelpers';

const employees: Employee[] = [
  { id: 'emp-001', name: 'A. Okafor', role: 'Engineer', weeklyHours: 40 },
  { id: '2', name: 'Sam Lee', role: 'Designer', weeklyHours: 32 },
];

describe('filterEmployees', () => {
  it('returns all employees for empty query', () => {
    expect(filterEmployees(employees, '  ')).toHaveLength(2);
  });

  it('filters by name or role case-insensitively', () => {
    expect(filterEmployees(employees, 'okafor').map((e) => e.id)).toEqual([
      'emp-001',
    ]);
    expect(filterEmployees(employees, 'design').map((e) => e.id)).toEqual(['2']);
  });
});
