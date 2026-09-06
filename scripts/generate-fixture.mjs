/**
 * Deterministic baseline fixture generator.
 *
 * Approved strategy (AGENTS.md): no supplied fixture existed in the repo;
 * generate stable data matching case-study counts with fixed IDs.
 *
 * Run: node scripts/generate-fixture.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'packages', 'data', 'seeder', 'baseline.json');

const ROLES = ['Engineer', 'Designer', 'PM', 'QA', 'Architect'];
const WEEKLY = [40, 32, 20];
const MONTHS = [
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
  '2026-11',
  '2026-12',
];

function pad(n, width = 3) {
  return String(n).padStart(width, '0');
}

const employees = [];
employees.push({
  id: 'emp-okafor',
  name: 'A. Okafor',
  role: 'Engineer',
  weeklyHours: 40,
});
for (let i = 2; i <= 60; i += 1) {
  employees.push({
    id: `emp-${pad(i)}`,
    name: `Employee ${pad(i)}`,
    role: ROLES[(i - 1) % ROLES.length],
    weeklyHours: WEEKLY[(i - 1) % WEEKLY.length],
  });
}

const rates = [];
rates.push({
  id: 'rate-okafor-80',
  employeeId: 'emp-okafor',
  validFrom: '2025-01-01',
  hourlyCost: 80,
});
rates.push({
  id: 'rate-okafor-95',
  employeeId: 'emp-okafor',
  validFrom: '2026-03-12',
  hourlyCost: 95,
});

const midMonthSpecs = [
  { emp: 'emp-002', day: '2026-01-15', cost: 55 },
  { emp: 'emp-003', day: '2026-02-10', cost: 62 },
  { emp: 'emp-004', day: '2026-03-12', cost: 70 },
  { emp: 'emp-005', day: '2026-04-18', cost: 48 },
  { emp: 'emp-006', day: '2026-05-14', cost: 75 },
  { emp: 'emp-007', day: '2026-06-11', cost: 66 },
  { emp: 'emp-008', day: '2026-07-16', cost: 58 },
  { emp: 'emp-009', day: '2026-08-13', cost: 81 },
  { emp: 'emp-010', day: '2026-09-17', cost: 53 },
  { emp: 'emp-011', day: '2026-10-15', cost: 69 },
];

let rateSeq = 1;
for (const emp of employees) {
  if (emp.id === 'emp-okafor') continue;
  rates.push({
    id: `rate-${pad(rateSeq++)}`,
    employeeId: emp.id,
    validFrom: '2025-01-01',
    hourlyCost: 40 + ((rateSeq * 3) % 50),
  });
}

for (let i = 0; i < midMonthSpecs.length; i += 1) {
  const spec = midMonthSpecs[i];
  rates.push({
    id: `rate-mid-${pad(i + 1)}`,
    employeeId: spec.emp,
    validFrom: spec.day,
    hourlyCost: spec.cost,
  });
}

let guard = 0;
while (rates.length < 150) {
  guard += 1;
  if (guard > 10_000) {
    throw new Error('rate generation failed to reach 150');
  }
  const emp = employees[(rates.length + guard) % employees.length];
  if (emp.id === 'emp-okafor') {
    continue;
  }
  const monthIndex = (rates.length % 12) + 1;
  const mm = String(monthIndex).padStart(2, '0');
  rates.push({
    id: `rate-extra-${pad(rateSeq++)}`,
    employeeId: emp.id,
    validFrom: `2024-${mm}-01`,
    hourlyCost: 45 + (rates.length % 40),
  });
}

const midMonthCount = rates.filter((r) => Number(r.validFrom.slice(8, 10)) > 1)
  .length;

const projects = [
  {
    id: 'proj-001',
    name: 'Project Alpha',
    startDate: '2026-01-01',
    endDate: '2026-09-30',
  },
  {
    id: 'proj-002',
    name: 'Project Beta',
    startDate: '2026-02-01',
    endDate: '2026-10-31',
  },
  {
    id: 'proj-003',
    name: 'Project Gamma',
    startDate: '2026-03-01',
    endDate: '2026-11-30',
  },
  {
    id: 'proj-004',
    name: 'Project Delta',
    startDate: '2026-01-15',
    endDate: '2026-12-31',
  },
];

// Exactly 90 WBS nodes: per project budget [22, 22, 22, 24]
const projectBudgets = [22, 22, 22, 24];
const breakdownItems = [];
let wbsSeq = 1;

for (let p = 0; p < projects.length; p += 1) {
  const project = projects[p];
  const budget = projectBudgets[p];
  const rootId = `wbs-${pad(wbsSeq++)}`;
  breakdownItems.push({
    id: rootId,
    projectId: project.id,
    parentId: null,
    name: `${project.name} Root`,
  });

  const remainingAfterRoot = budget - 1;
  // Use 4 or 5 L2 nodes; rest are L3 leaves
  const streamCount = p === 3 ? 5 : 4;
  const leafBudget = remainingAfterRoot - streamCount;
  const streams = [];

  for (let s = 0; s < streamCount; s += 1) {
    const streamId = `wbs-${pad(wbsSeq++)}`;
    streams.push(streamId);
    breakdownItems.push({
      id: streamId,
      projectId: project.id,
      parentId: rootId,
      name: `Stream ${s + 1}`,
    });
  }

  for (let leaf = 0; leaf < leafBudget; leaf += 1) {
    const parentId = streams[leaf % streams.length];
    breakdownItems.push({
      id: `wbs-${pad(wbsSeq++)}`,
      projectId: project.id,
      parentId,
      name: `Task ${leaf + 1}`,
    });
  }
}

const parentIds = new Set(
  breakdownItems.map((item) => item.parentId).filter((id) => id !== null),
);
const leaves = breakdownItems.filter((item) => !parentIds.has(item.id));
const leavesByProject = (projectId) =>
  leaves.filter((item) => item.projectId === projectId);

const allocations = [];
let allocSeq = 1;
outer: for (const leaf of leaves) {
  for (const emp of employees) {
    for (const month of MONTHS) {
      if (allocations.length >= 720) break outer;
      const amount = ((allocSeq % 5) + 1) * 0.1;
      allocations.push({
        id: `alloc-${pad(allocSeq, 4)}`,
        breakdownItemId: leaf.id,
        employeeId: emp.id,
        month,
        amount,
        updatedAt: `2026-01-01T12:${String(allocSeq % 60).padStart(2, '0')}:00.000Z`,
      });
      allocSeq += 1;
    }
  }
}

/**
 * Redistribute so overlapping projects contribute to capacity (still 720 total).
 * - Keep most cells on Alpha’s first leaf (densest).
 * - Move a block of employees onto Beta’s first leaf.
 * - Seed emp-okafor / 2026-03 on Alpha + Beta with amounts summing > 1.0 PM.
 */
const alphaLeaf = leavesByProject('proj-001')[0];
const betaLeaf = leavesByProject('proj-002')[0];
if (!alphaLeaf || !betaLeaf) {
  throw new Error('expected Alpha and Beta leaves for allocation redistribution');
}

const betaEmployeeIds = new Set(
  employees.slice(50, 55).map((emp) => emp.id),
); // emp-050 … emp-054 if present; indices 49–53 are emp-050..054 (okafor is index 0)

for (const allocation of allocations) {
  if (betaEmployeeIds.has(allocation.employeeId)) {
    allocation.breakdownItemId = betaLeaf.id;
  }
}

const okaforMarchAlpha = allocations.find(
  (a) =>
    a.employeeId === 'emp-okafor' &&
    a.month === '2026-03' &&
    a.breakdownItemId === alphaLeaf.id,
);
if (!okaforMarchAlpha) {
  throw new Error('expected emp-okafor March allocation on Alpha leaf');
}
okaforMarchAlpha.amount = 0.6;

const victim = allocations.find(
  (a) =>
    a.employeeId === 'emp-060' &&
    a.month === '2026-12' &&
    a.id !== okaforMarchAlpha.id,
);
if (!victim) {
  throw new Error('expected emp-060 Dec allocation to repurpose for overcapacity');
}
victim.breakdownItemId = betaLeaf.id;
victim.employeeId = 'emp-okafor';
victim.month = '2026-03';
victim.amount = 0.5;
victim.updatedAt = '2026-01-02T12:00:00.000Z';

const okaforMarchTotal = allocations
  .filter((a) => a.employeeId === 'emp-okafor' && a.month === '2026-03')
  .reduce((sum, a) => sum + a.amount, 0);
if (!(okaforMarchTotal > 1)) {
  throw new Error(
    `expected emp-okafor 2026-03 overcapacity (>1 PM), got ${okaforMarchTotal}`,
  );
}

const projectsWithOkaforMarch = new Set(
  allocations
    .filter((a) => a.employeeId === 'emp-okafor' && a.month === '2026-03')
    .map((a) => {
      const item = breakdownItems.find((b) => b.id === a.breakdownItemId);
      return item?.projectId;
    }),
);
if (projectsWithOkaforMarch.size < 2) {
  throw new Error('expected emp-okafor 2026-03 on at least two projects');
}

const betaLeafCount = allocations.filter(
  (a) => a.breakdownItemId === betaLeaf.id,
).length;

const fixture = {
  meta: {
    strategy: 'generated-approved',
    note: 'No supplied fixture was present; generated to match case-study counts with fixed IDs (AGENTS.md).',
    horizon: MONTHS,
    demo: {
      overcapacity: {
        employeeId: 'emp-okafor',
        month: '2026-03',
        totalPm: okaforMarchTotal,
        projects: [...projectsWithOkaforMarch],
      },
      betaLeafId: betaLeaf.id,
      alphaLeafId: alphaLeaf.id,
      allocationsOnBetaLeaf: betaLeafCount,
    },
    counts: {
      employees: employees.length,
      rates: rates.length,
      midMonthRateChanges: midMonthCount,
      projects: projects.length,
      breakdownItems: breakdownItems.length,
      leafBreakdownItems: leaves.length,
      allocations: allocations.length,
    },
  },
  employees,
  rates,
  projects,
  breakdownItems,
  allocations,
};

function assertCount(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

assertCount('employees', employees.length, 60);
assertCount('rates', rates.length, 150);
assertCount('projects', projects.length, 4);
assertCount('breakdownItems', breakdownItems.length, 90);
assertCount('allocations', allocations.length, 720);
if (midMonthCount < 10) {
  throw new Error(`mid-month rates: expected >= 10, got ${midMonthCount}`);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(fixture.meta.counts);
