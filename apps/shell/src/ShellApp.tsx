import {
  Component,
  type ErrorInfo,
  type ReactNode,
  Suspense,
  lazy,
  useState,
} from 'react';
import {
  DEFAULT_HOST_CONTEXT,
  type HostContext,
} from '@bps/contracts';
import { loadRemoteApp } from './loadRemotes';
import './index.css';

type RemoteName = 'people' | 'delivery';

const PeopleApp = lazy(() => loadRemoteApp('people'));
const DeliveryApp = lazy(() => loadRemoteApp('delivery'));

interface RemoteErrorBoundaryProps {
  remoteName: RemoteName;
  children: ReactNode;
  forceFail: boolean;
}

interface RemoteErrorBoundaryState {
  error: Error | null;
}

class RemoteErrorBoundary extends Component<
  RemoteErrorBoundaryProps,
  RemoteErrorBoundaryState
> {
  public state: RemoteErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): RemoteErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[shell] remote "${this.props.remoteName}" failed`, error, info);
  }

  public componentDidUpdate(prevProps: RemoteErrorBoundaryProps): void {
    if (prevProps.forceFail !== this.props.forceFail && !this.props.forceFail) {
      this.setState({ error: null });
    }
  }

  public render(): ReactNode {
    if (this.props.forceFail) {
      return (
        <RemoteFailure
          remoteName={this.props.remoteName}
          message="Remote failure deliberately triggered for demonstration."
        />
      );
    }

    if (this.state.error) {
      return (
        <RemoteFailure
          remoteName={this.props.remoteName}
          message={this.state.error.message}
        />
      );
    }

    return this.props.children;
  }
}

function RemoteFailure({
  remoteName,
  message,
}: {
  remoteName: RemoteName;
  message: string;
}) {
  return (
    <div role="alert" className="border border-red-800 p-4 text-red-900">
      <strong>{remoteName} failed to load</strong>
      <p>{message}</p>
      <p>Shell remains available. Other remotes are unaffected.</p>
    </div>
  );
}

const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;

export function ShellApp() {
  const [view, setView] = useState<RemoteName>('people');
  const [forceFailPeople, setForceFailPeople] = useState(false);
  const [forceFailDelivery, setForceFailDelivery] = useState(false);
  const [host, setHost] = useState<HostContext>(DEFAULT_HOST_CONTEXT);

  return (
    <div className="p-6 font-sans text-neutral-900">
      <header className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold">Baseline Planning Suite</h1>
        <p className="mb-3 text-neutral-600">
          Shell host — owns navigation, display currency, and active user; remotes
          receive them via <code>HostContext</code> props.
        </p>

        <div
          className="mb-4 flex flex-wrap items-end gap-4 border border-neutral-300 bg-neutral-50 p-3"
          data-testid="shell-host-context"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="shell-currency" className="text-sm font-medium">
              Currency
            </label>
            <select
              id="shell-currency"
              className="border border-neutral-300 bg-white px-2 py-1.5"
              value={host.currency}
              onChange={(event) =>
                setHost((prev) => ({ ...prev, currency: event.target.value }))
              }
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="shell-user-name" className="text-sm font-medium">
              Active user
            </label>
            <input
              id="shell-user-name"
              className="border border-neutral-300 bg-white px-2 py-1.5"
              value={host.activeUser.name}
              onChange={(event) =>
                setHost((prev) => ({
                  ...prev,
                  activeUser: {
                    ...prev.activeUser,
                    name: event.target.value,
                  },
                }))
              }
            />
          </div>
          <p className="text-sm text-neutral-600" data-testid="shell-context-summary">
            Showing as <strong>{host.activeUser.name}</strong> ·{' '}
            <strong>{host.currency}</strong>
          </p>
        </div>

        <nav className="flex flex-wrap gap-3" aria-label="Primary">
          <button
            type="button"
            className={`cursor-pointer border px-3 py-1.5 ${
              view === 'people'
                ? 'border-neutral-900 bg-neutral-200 font-semibold'
                : 'border-neutral-400 bg-white'
            }`}
            aria-current={view === 'people' ? 'page' : undefined}
            onClick={() => setView('people')}
          >
            People
          </button>
          <button
            type="button"
            className={`cursor-pointer border px-3 py-1.5 ${
              view === 'delivery'
                ? 'border-neutral-900 bg-neutral-200 font-semibold'
                : 'border-neutral-400 bg-white'
            }`}
            aria-current={view === 'delivery' ? 'page' : undefined}
            onClick={() => setView('delivery')}
          >
            Delivery
          </button>
          <button
            type="button"
            className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5"
            onClick={() => setForceFailPeople((value) => !value)}
          >
            {forceFailPeople ? 'Restore People' : 'Break People'}
          </button>
          <button
            type="button"
            className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5"
            onClick={() => setForceFailDelivery((value) => !value)}
          >
            {forceFailDelivery ? 'Restore Delivery' : 'Break Delivery'}
          </button>
        </nav>
      </header>

      {/* Keep both remotes mounted so BroadcastChannel rate updates reach Delivery while People is visible. */}
      <div
        className={view === 'people' ? undefined : 'hidden'}
        aria-hidden={view !== 'people'}
        data-testid="shell-people-panel"
      >
        <RemoteErrorBoundary remoteName="people" forceFail={forceFailPeople}>
          <Suspense fallback={<p>Loading People…</p>}>
            <PeopleApp host={host} />
          </Suspense>
        </RemoteErrorBoundary>
      </div>

      <div
        className={view === 'delivery' ? undefined : 'hidden'}
        aria-hidden={view !== 'delivery'}
        data-testid="shell-delivery-panel"
      >
        <RemoteErrorBoundary remoteName="delivery" forceFail={forceFailDelivery}>
          <Suspense fallback={<p>Loading Delivery…</p>}>
            <DeliveryApp host={host} />
          </Suspense>
        </RemoteErrorBoundary>
      </div>
    </div>
  );
}
