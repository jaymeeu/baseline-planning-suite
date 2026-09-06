import { useCallback, useEffect, useMemo, useState } from 'react';
import { publishBpsMessage } from '@bps/contracts';
import {
  assertWeeklyHours,
  sortRatesByValidFrom,
  summarizeAllCapacities,
  type Employee,
  type EmployeeMonthCapacity,
  type RateRecord,
  type WeeklyHours,
} from '@bps/domain';
import { bootstrapPeople, type PeopleBootstrap } from '../bootstrapPeople';
import {
  capacityForEmployee,
  filterEmployees,
  newRateId,
  oversubscribedEmployeeIds,
  validateRateInput,
} from '../peopleHelpers';

export function usePeopleData() {
  const [boot, setBoot] = useState<PeopleBootstrap | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rates, setRates] = useState<RateRecord[]>([]);
  const [capacity, setCapacity] = useState<EmployeeMonthCapacity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (repos: PeopleBootstrap) => {
    const [nextEmployees, nextRates, allocations] = await Promise.all([
      repos.people.employees.list(),
      repos.people.rates.list(),
      repos.delivery.allocations.list(),
    ]);
    // Preserve IndexedDB / seed order (fixture lists A. Okafor as emp-001 first).
    setEmployees(nextEmployees);
    setRates(nextRates);
    setCapacity([...summarizeAllCapacities(allocations)]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repos = await bootstrapPeople();
        if (cancelled) return;
        setBoot(repos);
        await reload(repos);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load People data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  /** Default to the first employee in seed / store order on load. */
  useEffect(() => {
    if (selectedId !== null) return;
    const first = employees[0];
    if (!first) return;
    setSelectedId(first.id);
  }, [employees, selectedId]);

  const oversubscribedIds = useMemo(
    () => oversubscribedEmployeeIds(capacity),
    [capacity],
  );

  const filtered = useMemo(
    () => filterEmployees(employees, query),
    [employees, query],
  );

  const selected = employees.find((e) => e.id === selectedId) ?? null;

  const selectedRates = useMemo(() => {
    if (!selectedId) return [];
    return sortRatesByValidFrom(rates.filter((r) => r.employeeId === selectedId));
  }, [rates, selectedId]);

  const selectedCapacity = useMemo(() => {
    if (!selectedId) return [];
    return capacityForEmployee(capacity, selectedId);
  }, [capacity, selectedId]);

  const saveEmployee = useCallback(
    async (draft: {
      name: string;
      role: string;
      weeklyHours: number;
    }) => {
      if (!boot || !selected) return;
      const weeklyHours = assertWeeklyHours(draft.weeklyHours) as WeeklyHours;
      const next: Employee = {
        ...selected,
        name: draft.name.trim(),
        role: draft.role.trim(),
        weeklyHours,
      };
      await boot.people.employees.upsert(next);
      await reload(boot);
    },
    [boot, reload, selected],
  );

  const saveRate = useCallback(
    async (input: {
      id?: string;
      validFrom: string;
      hourlyCost: number;
    }) => {
      if (!boot || !selectedId) return;
      const validationError = validateRateInput(input);
      if (validationError) {
        throw new Error(validationError);
      }
      const rate: RateRecord = {
        id: input.id ?? newRateId(),
        employeeId: selectedId,
        validFrom: input.validFrom,
        hourlyCost: input.hourlyCost,
      };
      // People is the sole owner of rates (bps-people). Notify Delivery via @bps/contracts.
      await boot.people.rates.upsert(rate);
      await reload(boot);
      publishBpsMessage({
        type: 'rates/changed',
        employeeId: rate.employeeId,
        rateId: rate.id,
        op: 'upsert',
        at: new Date().toISOString(),
      });
    },
    [boot, reload, selectedId],
  );

  const deleteRate = useCallback(
    async (rateId: string) => {
      if (!boot) return;
      const existing = rates.find((rate) => rate.id === rateId);
      await boot.people.rates.remove(rateId);
      await reload(boot);
      if (existing) {
        publishBpsMessage({
          type: 'rates/changed',
          employeeId: existing.employeeId,
          rateId: existing.id,
          op: 'delete',
          at: new Date().toISOString(),
        });
      }
    },
    [boot, rates, reload],
  );

  return {
    loading,
    error,
    query,
    setQuery,
    filtered,
    selected,
    setSelectedId,
    oversubscribedIds,
    selectedRates,
    selectedCapacity,
    saveEmployee,
    saveRate,
    deleteRate,
  };
}
