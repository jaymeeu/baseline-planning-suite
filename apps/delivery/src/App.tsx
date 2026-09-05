import {
  DEFAULT_HOST_CONTEXT,
  type HostContext,
} from '@bps/contracts';
import { ProjectList } from './components/ProjectList';
import { StaffingGrid } from './components/StaffingGrid';
import { WbsTree } from './components/WbsTree';
import { useDeliveryData } from './hooks/useDeliveryData';
import './index.css';

export interface DeliveryAppProps {
  host?: HostContext;
}

export function App({ host = DEFAULT_HOST_CONTEXT }: DeliveryAppProps) {
  const data = useDeliveryData();

  if (data.loading) {
    return (
      <main className="mx-auto max-w-[1200px] p-5 font-sans text-neutral-900">
        <p>Loading Delivery…</p>
      </main>
    );
  }

  if (data.error && data.projects.length === 0) {
    return (
      <main className="mx-auto max-w-[1200px] p-5 font-sans text-neutral-900">
        <p className="my-2 text-red-800" role="alert">
          {data.error}
        </p>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-[1200px] p-5 font-sans text-neutral-900"
      data-testid="delivery-app"
    >
      <header className="mb-4 border-b border-neutral-300 pb-3">
        <h1 className="mb-1 text-2xl font-semibold">Delivery</h1>
        <p className="m-0 text-sm text-neutral-600" data-testid="delivery-mode">
          Projects, WBS &amp; staffing · currency {host.currency} ·{' '}
          {host.activeUser.name}
        </p>
      </header>

      {data.message ? (
        <p
          className="mb-3 border border-neutral-400 bg-neutral-100 px-3 py-2 text-sm"
          role="status"
        >
          {data.message}{' '}
          <button
            type="button"
            className="ml-2 cursor-pointer underline"
            onClick={data.clearMessage}
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(240px,320px)_1fr]">
        <ProjectList
          projects={data.projects}
          selectedId={data.selectedProjectId}
          onSelect={data.setSelectedProjectId}
          onSave={data.saveProject}
        />

        <div>
          {data.selectedProject ? (
            <>
              <WbsTree
                projectName={data.selectedProject.name}
                flat={data.wbsFlat}
                items={data.projectItems}
                onAddRoot={data.addRootItem}
                onAddChild={data.addChildItem}
                onRename={data.renameItem}
                onMove={data.moveItem}
                onDelete={data.deleteItem}
              />
              <StaffingGrid
                projectName={data.selectedProject.name}
                items={data.projectItems}
                wbsFlat={data.wbsFlat}
                allocations={data.allocations}
                employees={data.employees}
                rates={data.rates}
                selectedBreakdownId={data.selectedBreakdownId}
                selectedIsLeaf={data.selectedIsLeaf}
                selectedBreakdownName={data.selectedBreakdown?.name ?? null}
                onSelectBreakdown={data.setSelectedBreakdownId}
                displayUnit={data.displayUnit}
                onDisplayUnitChange={data.setDisplayUnit}
                capacityByEmployeeMonth={data.capacityByEmployeeMonth}
                onSaveAllocation={data.saveAllocation}
              />
            </>
          ) : (
            <section className="border border-neutral-300 bg-neutral-50 p-3">
              <p className="text-neutral-600">
                Select a project to view WBS and staffing.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
