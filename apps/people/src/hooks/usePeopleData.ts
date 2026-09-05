import { useCallback, useEffect, useMemo, useState } from 'react';
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
    setEmployees(
      [...nextEmployees].sort((a, b) => a.name.localeCompare(b.name)),
    );
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
      // People is the sole owner of rates (bps-people). Delivery reads via contract later.
      await boot.people.rates.upsert(rate);
      await reload(boot);
    },
    [boot, reload, selectedId],
  );

  const deleteRate = useCallback(
    async (rateId: string) => {
      if (!boot) return;
      await boot.people.rates.remove(rateId);
      await reload(boot);
    },
    [boot, reload],
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
