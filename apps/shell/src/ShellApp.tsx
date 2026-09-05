import {
  Component,
  type ErrorInfo,
  type ReactNode,
  Suspense,
  lazy,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_HOST_CONTEXT,
  type HostContext,
} from '@bps/contracts';
import { loadRemoteApp } from './loadRemotes';
import {
  formatRemoteFailureMessage,
  type RemoteName,
} from './remoteFailure';
import './index.css';

interface RemoteErrorBoundaryProps {
  remoteName: RemoteName;
  children: ReactNode;
  forceFail: boolean;
  onRetry: () => void;
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

  private handleRetry = (): void => {
    this.setState({ error: null });
    this.props.onRetry();
  };

  public render(): ReactNode {
    if (this.props.forceFail) {
      return (
        <RemoteFailure
          remoteName={this.props.remoteName}
          message="Remote failure deliberately triggered for demonstration."
          onRetry={this.handleRetry}
        />
      );
    }

    if (this.state.error) {
      return (
        <RemoteFailure
          remoteName={this.props.remoteName}
          message={this.state.error.message}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

function RemoteFailure({
  remoteName,
  message,
  onRetry,
}: {
  remoteName: RemoteName;
  message: string;
  onRetry: () => void;
}) {
  const copy = formatRemoteFailureMessage(remoteName, message);
  return (
    <div role="alert" className="border border-red-800 p-4 text-red-900">
      <strong>{copy.title}</strong>
      <p>{copy.detail}</p>
      <p>{copy.isolationNote}</p>
      <button
        type="button"
        className="mt-3 cursor-pointer border border-red-800 bg-white px-3 py-1.5"
        onClick={onRetry}
      >
        Retry {remoteName}
      </button>
    </div>
  );
}

/** Fresh `lazy()` when `mountKey` changes so a failed load can be retried. */
function RemotePanel({
  remote,
  host,
  mountKey,
}: {
  remote: RemoteName;
  host: HostContext;
  mountKey: number;
}) {
  const LazyApp = useMemo(
    () => lazy(() => loadRemoteApp(remote)),
    [remote, mountKey],
  );
  return (
    <Suspense fallback={<p>Loading {remote}…</p>}>
      <LazyApp host={host} />
    </Suspense>
  );
}

const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;

export function ShellApp() {
  const [view, setView] = useState<RemoteName>('people');
  const [forceFailPeople, setForceFailPeople] = useState(false);
  const [forceFailDelivery, setForceFailDelivery] = useState(false);
  const [peopleMountKey, setPeopleMountKey] = useState(0);
  const [deliveryMountKey, setDeliveryMountKey] = useState(0);
  const [host, setHost] = useState<HostContext>(DEFAULT_HOST_CONTEXT);

  const retryPeople = (): void => {
    setForceFailPeople(false);
    setPeopleMountKey((key) => key + 1);
  };

  const retryDelivery = (): void => {
    setForceFailDelivery(false);
    setDeliveryMountKey((key) => key + 1);
  };

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
        <RemoteErrorBoundary
          remoteName="people"
          forceFail={forceFailPeople}
          onRetry={retryPeople}
        >
          <RemotePanel remote="people" host={host} mountKey={peopleMountKey} />
        </RemoteErrorBoundary>
      </div>

      <div
        className={view === 'delivery' ? undefined : 'hidden'}
        aria-hidden={view !== 'delivery'}
        data-testid="shell-delivery-panel"
      >
        <RemoteErrorBoundary
          remoteName="delivery"
          forceFail={forceFailDelivery}
          onRetry={retryDelivery}
        >
          <RemotePanel
            remote="delivery"
            host={host}
            mountKey={deliveryMountKey}
          />
        </RemoteErrorBoundary>
      </div>
    </div>
  );
}
