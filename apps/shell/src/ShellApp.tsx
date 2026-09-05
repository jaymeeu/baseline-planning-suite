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
    <div role="alert" className="bps-alert bps-alert--error">
      <strong>{copy.title}</strong>
      <p className="m-0">{copy.detail}</p>
      <p className="m-0 mt-1">{copy.isolationNote}</p>
      <button
        type="button"
        className="bps-btn bps-btn--danger mt-3"
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
    <Suspense
      fallback={
        <div className="bps-panel" aria-busy="true">
          <div className="bps-skeleton mb-3 h-4 w-40" />
          <p className="bps-meta m-0">Loading {remote}…</p>
        </div>
      }
    >
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
    <div className="p-6">
      <header className="mb-6">
        <h1 className="bps-title mb-1">Baseline Planning Suite</h1>
        <p className="bps-meta mb-3">
          Shell host — owns navigation, display currency, and active user; remotes
          receive them via <code>HostContext</code> props.
        </p>

        <div
          className="bps-panel mb-4 flex flex-wrap items-end gap-4"
          data-testid="shell-host-context"
        >
          <div className="bps-field">
            <label htmlFor="shell-currency">Currency</label>
            <select
              id="shell-currency"
              className="bps-field__control"
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
          <div className="bps-field">
            <label htmlFor="shell-user-name">Active user</label>
            <input
              id="shell-user-name"
              className="bps-field__control"
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
          <p className="bps-meta" data-testid="shell-context-summary">
            Showing as <strong className="text-bps-ink">{host.activeUser.name}</strong>{' '}
            · <strong className="text-bps-ink">{host.currency}</strong>
          </p>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Primary">
          <button
            type="button"
            className={`bps-btn ${
              view === 'people' ? 'bps-btn--primary' : 'bps-btn--secondary'
            }`}
            aria-current={view === 'people' ? 'page' : undefined}
            onClick={() => setView('people')}
          >
            People
          </button>
          <button
            type="button"
            className={`bps-btn ${
              view === 'delivery' ? 'bps-btn--primary' : 'bps-btn--secondary'
            }`}
            aria-current={view === 'delivery' ? 'page' : undefined}
            onClick={() => setView('delivery')}
          >
            Delivery
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--ghost"
            onClick={() => setForceFailPeople((value) => !value)}
          >
            {forceFailPeople ? 'Restore People' : 'Break People'}
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--ghost"
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
