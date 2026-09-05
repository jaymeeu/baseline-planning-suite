import type { Project } from '@bps/domain';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function newProjectId(): string {
  return `proj-user-${crypto.randomUUID()}`;
}

export function newBreakdownItemId(): string {
  return `wbs-user-${crypto.randomUUID()}`;
}

export function validateProjectInput(input: {
  name: string;
  startDate: string;
  endDate: string;
}): string | undefined {
  if (!input.name.trim()) {
    return 'Project name is required';
  }
  if (!ISO_DATE.test(input.startDate) || !ISO_DATE.test(input.endDate)) {
    return 'Dates must be YYYY-MM-DD';
  }
  if (input.startDate > input.endDate) {
    return 'startDate must be on or before endDate';
  }
  return undefined;
}

export function validateBreakdownName(name: string): string | undefined {
  if (!name.trim()) {
    return 'Breakdown item name is required';
  }
  return undefined;
}

export function sortProjects(projects: readonly Project[]): Project[] {
  return [...projects].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
}
