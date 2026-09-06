/**
 * Deterministic baseline fixture generator.
 *
 * Approved strategy (AGENTS.md): generate stable data matching case-study
 * counts with fixed IDs. Writes split files under seeder/.
 *
 * Run: node scripts/generate-fixture.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const seederDir = join(root, 'seeder');

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

/** Fixed display names for emp-002 … emp-060 (emp-001 is A. Okafor). */
const EMPLOYEE_NAMES = [
  'M. Brandt',
  'S. Haddad',
  'L. Nguyen',
  'J. Okonkwo',
  'R. Patel',
  'K. Silva',
  'E. Kowalski',
  'T. Bergström',
  'N. Rossi',
  'C. Mwangi',
  'H. Tanaka',
  'D. Álvarez',
  'P. Dubois',
  'A. Ibrahim',
  'Y. Chen',
  'F. Müller',
  'I. Santos',
  'B. Okafor',
  'G. Andersson',
  'V. Petrov',
  'O. Jensen',
  'W. Kim',
  'Z. Nowak',
  'Q. Adeyemi',
  'U. Sharma',
  'X. Costa',
  'M. Lindqvist',
  'S. Moreau',
  'L. Bakker',
  'J. Papadopoulos',
  'R. Fernandes',
  'K. Horváth',
  'E. Novák',
  'T. Yamamoto',
  'N. García',
  'C. Osei',
  'H. Berg',
  'D. Kowalski',
  'P. Ndiaye',
  'A. Volkov',
  'Y. Park',
  'F. Ricci',
  'I. Hassan',
  'B. Lefèvre',
  'G. Singh',
  'V. Costa',
  'O. Madsen',
  'W. Zhao',
  'Z. Kowalska',
  'Q. Diallo',
  'U. Romero',
  'X. Nielsen',
  'M. Duarte',
  'S. Benedetti',
  'L. Okafor',
  'J. Svoboda',
  'R. Johansson',
  'K. Mensah',
  'E. Fontaine',
];

function pad(n, width = 3) {
  return String(n).padStart(width, '0');
}

const employees = [];
employees.push({
  id: 'emp-001',
  name: 'A. Okafor',
  role: 'Engineer',
  weeklyHours: 40,
});
if (EMPLOYEE_NAMES.length !== 59) {
  throw new Error(
    `EMPLOYEE_NAMES: expected 59 names for emp-002…060, got ${EMPLOYEE_NAMES.length}`,
  );
}
for (let i = 2; i <= 60; i += 1) {
  employees.push({
    id: `emp-${pad(i)}`,
    name: EMPLOYEE_NAMES[i - 2],
    role: ROLES[(i - 1) % ROLES.length],
    weeklyHours: WEEKLY[(i - 1) % WEEKLY.length],
  });
}

const rates = [];
rates.push({
  id: 'rate-001-80',
  employeeId: 'emp-001',
  validFrom: '2025-01-01',
  hourlyCost: 80,
});
rates.push({
  id: 'rate-001-95',
  employeeId: 'emp-001',
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
  if (emp.id === 'emp-001') continue;
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
  if (emp.id === 'emp-001') continue;
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
    name: 'Ledger Migration',
    startDate: '2026-01-01',
    endDate: '2026-09-30',
  },
  {
    id: 'proj-002',
    name: 'Customer Portal',
    startDate: '2026-02-01',
    endDate: '2026-10-31',
  },
  {
    id: 'proj-003',
    name: 'Risk Analytics',
    startDate: '2026-03-01',
    endDate: '2026-11-30',
  },
  {
    id: 'proj-004',
    name: 'Payments Hub',
    startDate: '2026-01-15',
    endDate: '2026-12-31',
  },
];

const PROJECT_WBS = [
  {
    streams: ['Data mapping', 'Core cut-over', 'Reconciliation', 'Reporting'],
    tasks: [
      'Chart of accounts map',
      'Opening balance extract',
      'Historical journal load',
      'Trial balance check',
      'Subledger bridge',
      'Cut-over weekend plan',
      'Parallel run support',
      'Go-live hypercare',
      'Exception queue triage',
      'Intercompany matching',
      'Bank reconcile pack',
      'Suspense clear-down',
      'Management pack rebuild',
      'Statutory report templates',
      'Audit trail export',
      'Close calendar update',
      'Board dashboard refresh',
    ],
  },
  {
    streams: [
      'Identity & access',
      'Account self-service',
      'Onboarding journeys',
      'Support tooling',
    ],
    tasks: [
      'SSO federation',
      'MFA enrolment flow',
      'Password reset UX',
      'Profile preferences',
      'Statement download',
      'Card controls UI',
      'KYC document upload',
      'Address change flow',
      'Product switch wizard',
      'Welcome email pack',
      'Agent assist console',
      'Case routing rules',
      'Knowledge base sync',
      'Chat escalation path',
      'Accessibility pass',
      'Mobile web polish',
      'Release notes hub',
    ],
  },
  {
    streams: ['Data platform', 'Model pipeline', 'Scorecards', 'Governance'],
    tasks: [
      'Feature store feed',
      'Credit bureau ingest',
      'Transaction signals',
      'Fraud label backfill',
      'Model training jobs',
      'Shadow scoring',
      'Champion challenger',
      'Latency budget check',
      'Retail scorecard UI',
      'SME risk tiles',
      'Limit recommendation',
      'Early warning alerts',
      'Model risk review',
      'Fairness monitoring',
      'Decision log archive',
      'Policy rule sync',
      'Regulator pack draft',
    ],
  },
  {
    streams: [
      'Rails & schemes',
      'Merchant onboarding',
      'Settlement',
      'Ops console',
      'Compliance',
    ],
    tasks: [
      'SEPA connector',
      'Card scheme cert',
      'Instant payment path',
      'FX quote service',
      'Merchant KYB form',
      'Terminal provisioning',
      'Fee schedule engine',
      'Chargeback workflow',
      'Daily settlement file',
      'Nostro reconcile',
      'Fail-over drill',
      'Ops alert rules',
      'Manual repair desk',
      'SLA dashboard',
      'AML screening hook',
      'Sanctions list sync',
      'PCI evidence pack',
      'Incident runbooks',
    ],
  },
];

const projectBudgets = [22, 22, 22, 24];
const breakdownItems = [];
let wbsSeq = 1;

for (let p = 0; p < projects.length; p += 1) {
  const project = projects[p];
  const catalog = PROJECT_WBS[p];
  const budget = projectBudgets[p];
  const rootId = `wbs-${pad(wbsSeq++)}`;
  breakdownItems.push({
    id: rootId,
    projectId: project.id,
    parentId: null,
    name: project.name,
  });

  const remainingAfterRoot = budget - 1;
  const streamCount = catalog.streams.length;
  const leafBudget = remainingAfterRoot - streamCount;
  if (leafBudget !== catalog.tasks.length) {
    throw new Error(
      `${project.name}: expected ${leafBudget} tasks, catalog has ${catalog.tasks.length}`,
    );
  }
  const streams = [];

  for (let s = 0; s < streamCount; s += 1) {
    const streamId = `wbs-${pad(wbsSeq++)}`;
    streams.push(streamId);
    breakdownItems.push({
      id: streamId,
      projectId: project.id,
      parentId: rootId,
      name: catalog.streams[s],
    });
  }

  for (let leaf = 0; leaf < leafBudget; leaf += 1) {
    const parentId = streams[leaf % streams.length];
    breakdownItems.push({
      id: `wbs-${pad(wbsSeq++)}`,
      projectId: project.id,
      parentId,
      name: catalog.tasks[leaf],
    });
  }
}

const parentIds = new Set(
  breakdownItems.map((item) => item.parentId).filter((id) => id !== null),
);
const leaves = breakdownItems.filter((item) => !parentIds.has(item.id));
const leavesByProject = (projectId) =>
  leaves.filter((item) => item.projectId === projectId);

function leafByName(projectId, name) {
  const found = leavesByProject(projectId).find((item) => item.name === name);
  if (!found) {
    throw new Error(`expected leaf "${name}" on ${projectId}`);
  }
  return found;
}

// Demo staffing leaves (named) — Cut-over holds Ledger allocations for e2e UX.
const alphaLeaf = leafByName('proj-001', 'Cut-over weekend plan');
const betaLeaf = leafByName('proj-002', 'SSO federation');
const gammaLeaf = leavesByProject('proj-003')[0];
const deltaLeaf = leavesByProject('proj-004')[0];
if (!gammaLeaf || !deltaLeaf) {
  throw new Error('expected a primary leaf on Risk and Payments projects');
}

/**
 * Spread 720 cells across all four projects so every staffing grid has data.
 * Ledger + Portal share emp-001…015 so Okafor appears on both for overcapacity.
 */
const allocations = [];
let allocSeq = 1;

function pushStaffingBlock(leafId, employeeSlice) {
  for (const emp of employeeSlice) {
    for (const month of MONTHS) {
      const amount = ((allocSeq % 5) + 1) * 0.1;
      allocations.push({
        id: `alloc-${pad(allocSeq, 4)}`,
        breakdownItemId: leafId,
        employeeId: emp.id,
        month,
        amount,
        updatedAt: `2026-01-01T12:${String(allocSeq % 60).padStart(2, '0')}:00.000Z`,
      });
      allocSeq += 1;
    }
  }
}

pushStaffingBlock(alphaLeaf.id, employees.slice(0, 15));
pushStaffingBlock(betaLeaf.id, employees.slice(0, 15));
pushStaffingBlock(gammaLeaf.id, employees.slice(15, 30));
pushStaffingBlock(deltaLeaf.id, employees.slice(30, 45));

if (allocations.length !== 720) {
  throw new Error(
    `expected 720 allocations after staffing blocks, got ${allocations.length}`,
  );
}

/**
 * Overcapacity demo (e2e §2 / §5):
 * emp-001 / 2026-03 = 0.6 PM on Ledger leaf + 0.5 PM on Portal leaf = 1.1 PM.
 * Beta cell gets a later updatedAt so it is the causing allocation.
 */
const okaforMarchAlpha = allocations.find(
  (a) =>
    a.employeeId === 'emp-001' &&
    a.month === '2026-03' &&
    a.breakdownItemId === alphaLeaf.id,
);
const okaforMarchBeta = allocations.find(
  (a) =>
    a.employeeId === 'emp-001' &&
    a.month === '2026-03' &&
    a.breakdownItemId === betaLeaf.id,
);
if (!okaforMarchAlpha || !okaforMarchBeta) {
  throw new Error('expected emp-001 March allocations on Ledger + Portal leaves');
}
okaforMarchAlpha.amount = 0.6;
okaforMarchBeta.amount = 0.5;
okaforMarchBeta.updatedAt = '2026-01-02T12:00:00.000Z';

const okaforMarchTotal = okaforMarchAlpha.amount + okaforMarchBeta.amount;
if (!(okaforMarchTotal > 1)) {
  throw new Error(
    `expected emp-001 2026-03 overcapacity (>1 PM), got ${okaforMarchTotal}`,
  );
}

const betaLeafCount = allocations.filter(
  (a) => a.breakdownItemId === betaLeaf.id,
).length;
const alphaLeafCount = allocations.filter(
  (a) => a.breakdownItemId === alphaLeaf.id,
).length;

const fixture = {
  meta: {
    strategy: 'generated-approved',
    note: 'No supplied fixture was present; generated to match case-study counts with fixed IDs (AGENTS.md).',
    horizon: MONTHS,
    demo: {
      overcapacity: {
        employeeId: 'emp-001',
        month: '2026-03',
        totalPm: okaforMarchTotal,
        projects: ['proj-001', 'proj-002'],
        causingAllocationId: okaforMarchBeta.id,
        slices: [
          {
            projectId: 'proj-001',
            breakdownItemId: alphaLeaf.id,
            amountPm: okaforMarchAlpha.amount,
            allocationId: okaforMarchAlpha.id,
          },
          {
            projectId: 'proj-002',
            breakdownItemId: betaLeaf.id,
            amountPm: okaforMarchBeta.amount,
            allocationId: okaforMarchBeta.id,
          },
        ],
      },
      alphaLeafId: alphaLeaf.id,
      betaLeafId: betaLeaf.id,
      gammaLeafId: gammaLeaf.id,
      deltaLeafId: deltaLeaf.id,
      allocationsOnAlphaLeaf: alphaLeafCount,
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

mkdirSync(seederDir, { recursive: true });

function writeJson(fileName, value) {
  const path = join(seederDir, fileName);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return path;
}

const written = [
  writeJson('meta.json', fixture.meta),
  writeJson('employees.json', fixture.employees),
  writeJson('rates.json', fixture.rates),
  writeJson('projects.json', fixture.projects),
  writeJson('breakdownItems.json', fixture.breakdownItems),
  writeJson('allocations.json', fixture.allocations),
];

console.log(`Wrote ${written.length} seeder files under ${seederDir}`);
console.log(fixture.meta.counts);
console.log('overcapacity', fixture.meta.demo.overcapacity);
