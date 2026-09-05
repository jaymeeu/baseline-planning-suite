import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  assertAllocationTargetIsLeaf,
  assertCanMoveItem,
  buildWbsForest,
  collectSubtreeIds,
  flattenWbsForest,
  isLeaf,
  planInsertChildWithAllocations,
  summarizeAllCapacities,
  toCanonical,
  type BreakdownItem,
  type CapacityAllocation,
  type DisplayUnit,
  type Employee,
  type EmployeeMonthCapacity,
  type Project,
  type RateRecord,
  type WbsTreeNode,
  type YearMonth,
} from '@bps/domain';
import {
  bootstrapDelivery,
  type DeliveryBootstrap,
} from '../bootstrapDelivery';
import {
  ZERO_PM_EPSILON,
  buildConversionContext,
  firstLeafId,
  indexAllocationsByCell,
  newAllocationId,
  newBreakdownItemId,
  newProjectId,
  parseDisplayInput,
  sortEmployees,
  sortProjects,
  validateBreakdownName,
  validateDisplayAmount,
  validateProjectInput,
} from '../deliveryHelpers';

export function useDeliveryData() {
  const [boot, setBoot] = useState<DeliveryBootstrap | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([]);
  const [allocations, setAllocations] = useState<CapacityAllocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rates, setRates] = useState<RateRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedBreakdownId, setSelectedBreakdownId] = useState<string | null>(
    null,
  );
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('PM');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (repos: DeliveryBootstrap) => {
    const [
      nextProjects,
      nextItems,
      nextAllocations,
      nextEmployees,
      nextRates,
    ] = await Promise.all([
      repos.delivery.projects.list(),
      repos.delivery.breakdownItems.list(),
      repos.delivery.allocations.list(),
      repos.people.employees.list(),
      repos.people.rates.list(),
    ]);
    setProjects(sortProjects(nextProjects));
    setBreakdownItems(nextItems);
    setAllocations(nextAllocations);
    setEmployees(sortEmployees(nextEmployees));
    setRates(nextRates);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repos = await bootstrapDelivery();
        if (cancelled) return;
        setBoot(repos);
        await reload(repos);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load Delivery data',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;

  const projectItems = useMemo(() => {
    if (!selectedProjectId) return [];
    return breakdownItems.filter((item) => item.projectId === selectedProjectId);
  }, [breakdownItems, selectedProjectId]);

  const wbsForest = useMemo(() => {
    if (!selectedProjectId) return [];
    return buildWbsForest(breakdownItems, selectedProjectId);
  }, [breakdownItems, selectedProjectId]);

  const wbsFlat = useMemo(() => flattenWbsForest(wbsForest), [wbsForest]);

  /** Always a node from the current project (avoids one-frame stale IDs on project switch). */
  const activeBreakdownId = useMemo(() => {
    if (!selectedProjectId) return null;
    if (
      selectedBreakdownId !== null &&
      projectItems.some((item) => item.id === selectedBreakdownId)
    ) {
      return selectedBreakdownId;
    }
    return firstLeafId(wbsFlat);
  }, [selectedProjectId, selectedBreakdownId, projectItems, wbsFlat]);

  const selectedBreakdown =
    projectItems.find((item) => item.id === activeBreakdownId) ?? null;

  const selectedIsLeaf = useMemo(() => {
    if (!activeBreakdownId) return false;
    try {
      return isLeaf(breakdownItems, activeBreakdownId);
    } catch {
      return false;
    }
  }, [breakdownItems, activeBreakdownId]);

  const capacityByEmployeeMonth = useMemo(() => {
    const summaries = summarizeAllCapacities(allocations);
    const map = new Map<string, EmployeeMonthCapacity>();
    for (const summary of summaries) {
      map.set(`${summary.employeeId}|${summary.month}`, summary);
    }
    return map;
  }, [allocations]);

  const allocationByCell = useMemo(
    () => indexAllocationsByCell(allocations),
    [allocations],
  );

  const selectProject = useCallback((id: string) => {
    setSelectedProjectId(id);
    setSelectedBreakdownId(null);
  }, []);

  const saveProject = useCallback(
    async (draft: {
      id?: string;
      name: string;
      startDate: string;
      endDate: string;
    }) => {
      if (!boot) throw new Error('Delivery is not ready');
      const validation = validateProjectInput(draft);
      if (validation) throw new Error(validation);
      const project: Project = {
        id: draft.id ?? newProjectId(),
        name: draft.name.trim(),
        startDate: draft.startDate,
        endDate: draft.endDate,
      };
      await boot.delivery.projects.upsert(project);
      await reload(boot);
      setSelectedProjectId(project.id);
      setMessage(null);
      setError(null);
    },
    [boot, reload],
  );

  const addRootItem = useCallback(
    async (name: string) => {
      if (!boot || !selectedProjectId) {
        throw new Error('Select a project first');
      }
      const validation = validateBreakdownName(name);
      if (validation) throw new Error(validation);
      const item: BreakdownItem = {
        id: newBreakdownItemId(),
        projectId: selectedProjectId,
        parentId: null,
        name: name.trim(),
      };
      await boot.delivery.breakdownItems.upsert(item);
      await reload(boot);
      setMessage(null);
      setError(null);
    },
    [boot, reload, selectedProjectId],
  );

  const addChildItem = useCallback(
    async (parentId: string, name: string) => {
      if (!boot) throw new Error('Delivery is not ready');
      const validation = validateBreakdownName(name);
      if (validation) throw new Error(validation);

      const parentAllocations =
        await boot.delivery.allocations.listByBreakdownItemId(parentId);
      const plan = planInsertChildWithAllocations({
        items: breakdownItems,
        parentId,
        childId: newBreakdownItemId(),
        childName: name.trim(),
        parentAllocations,
        updatedAt: new Date().toISOString(),
      });

      await boot.delivery.breakdownItems.upsert(plan.newChild);
      for (const allocation of plan.reassignedAllocations) {
        await boot.delivery.allocations.upsert(allocation);
      }
      await reload(boot);

      if (plan.movedAllocationCount > 0) {
        setMessage(
          `Moved ${plan.movedAllocationCount} allocation(s) from parent onto new child “${plan.newChild.name}”.`,
        );
      } else {
        setMessage(null);
      }
      setError(null);
    },
    [boot, breakdownItems, reload],
  );

  const renameItem = useCallback(
    async (itemId: string, name: string) => {
      if (!boot) throw new Error('Delivery is not ready');
      const validation = validateBreakdownName(name);
      if (validation) throw new Error(validation);
      const existing = breakdownItems.find((item) => item.id === itemId);
      if (!existing) throw new Error(`Breakdown item not found: ${itemId}`);
      await boot.delivery.breakdownItems.upsert({
        ...existing,
        name: name.trim(),
      });
      await reload(boot);
      setMessage(null);
      setError(null);
    },
    [boot, breakdownItems, reload],
  );

  const moveItem = useCallback(
    async (itemId: string, newParentId: string | null) => {
      if (!boot) throw new Error('Delivery is not ready');
      assertCanMoveItem(breakdownItems, itemId, newParentId);
      const existing = breakdownItems.find((item) => item.id === itemId);
      if (!existing) throw new Error(`Breakdown item not found: ${itemId}`);

      let movedFromParent = 0;
      if (newParentId !== null) {
        const parentAllocations =
          await boot.delivery.allocations.listByBreakdownItemId(newParentId);
        if (parentAllocations.length > 0) {
          const movedHasChildren = breakdownItems.some(
            (item) => item.parentId === itemId,
          );
          if (movedHasChildren) {
            throw new Error(
              `Cannot move a non-leaf under ${newParentId}: that parent still has allocations and the moved item cannot receive them`,
            );
          }
          const updatedAt = new Date().toISOString();
          for (const allocation of parentAllocations) {
            await boot.delivery.allocations.upsert({
              ...allocation,
              breakdownItemId: itemId,
              updatedAt,
            });
          }
          movedFromParent = parentAllocations.length;
        }
      }

      await boot.delivery.breakdownItems.upsert({
        ...existing,
        parentId: newParentId,
      });
      await reload(boot);
      if (movedFromParent > 0) {
        setMessage(
          `Moved ${movedFromParent} allocation(s) from former leaf parent onto “${existing.name}”.`,
        );
      } else {
        setMessage(null);
      }
      setError(null);
    },
    [boot, breakdownItems, reload],
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      if (!boot) throw new Error('Delivery is not ready');
      const subtreeIds = collectSubtreeIds(breakdownItems, itemId);
      for (const id of subtreeIds) {
        const attached =
          await boot.delivery.allocations.listByBreakdownItemId(id);
        for (const allocation of attached) {
          await boot.delivery.allocations.remove(allocation.id);
        }
        await boot.delivery.breakdownItems.remove(id);
      }
      await reload(boot);
      setMessage(null);
      setError(null);
    },
    [boot, breakdownItems, reload],
  );

  const saveAllocation = useCallback(
    async (input: {
      breakdownItemId: string;
      employeeId: string;
      month: YearMonth;
      displayValue: string;
    }) => {
      if (!boot) throw new Error('Delivery is not ready');
      assertAllocationTargetIsLeaf(breakdownItems, input.breakdownItemId);

      const parsed = parseDisplayInput(input.displayValue);
      if (parsed === undefined) {
        throw new Error('Allocation must be a non-negative number');
      }
      const validation = validateDisplayAmount(parsed);
      if (validation) throw new Error(validation);

      const employee = employees.find((e) => e.id === input.employeeId);
      if (!employee) {
        throw new Error(`Employee not found: ${input.employeeId}`);
      }

      const ctx = buildConversionContext(employee, input.month, rates);
      const amountPm = toCanonical(displayUnit, parsed, ctx);

      const existing = allocationByCell.get(
        `${input.breakdownItemId}|${input.employeeId}|${input.month}`,
      );

      if (Math.abs(amountPm) < ZERO_PM_EPSILON) {
        if (existing) {
          await boot.delivery.allocations.remove(existing.id);
        }
      } else {
        await boot.delivery.allocations.upsert({
          id: existing?.id ?? newAllocationId(),
          breakdownItemId: input.breakdownItemId,
          employeeId: input.employeeId,
          month: input.month,
          amount: amountPm,
          updatedAt: new Date().toISOString(),
        });
      }

      await reload(boot);
      setError(null);
    },
    [
      allocationByCell,
      boot,
      breakdownItems,
      displayUnit,
      employees,
      rates,
      reload,
    ],
  );

  return {
    loading,
    error,
    message,
    clearMessage: () => setMessage(null),
    projects,
    selectedProjectId,
    setSelectedProjectId: selectProject,
    selectedProject,
    projectItems,
    wbsForest,
    wbsFlat,
    allocations,
    employees,
    rates,
    displayUnit,
    setDisplayUnit,
    selectedBreakdownId: activeBreakdownId,
    setSelectedBreakdownId,
    selectedBreakdown,
    selectedIsLeaf,
    capacityByEmployeeMonth,
    saveProject,
    addRootItem,
    addChildItem,
    renameItem,
    moveItem,
    deleteItem,
    saveAllocation,
  };
}

export type { WbsTreeNode };
