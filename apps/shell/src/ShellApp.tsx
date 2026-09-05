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
      <p className="bps-meta m-0 mt-2" style={{ color: 'inherit', opacity: 0.9 }}>
        {copy.isolationNote}
      </p>
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

function RemoteLoadingFallback({ remote }: { remote: RemoteName }) {
  const label = remote === 'people' ? 'People' : 'Delivery';
  return (
    <div className="bps-panel" aria-busy="true" aria-live="polite">
      <div className="bps-skeleton-block">
        <div className="bps-skeleton h-5 w-48" />
        <div className="bps-skeleton h-3 w-full max-w-md" />
        <div className="bps-skeleton h-3 w-3/4 max-w-sm" />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="bps-skeleton h-24 w-full" />
          <div className="bps-skeleton h-24 w-full" />
        </div>
      </div>
      <p className="bps-meta m-0 mt-3">Loading {label}…</p>
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
    <Suspense fallback={<RemoteLoadingFallback remote={remote} />}>
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
    <div className="mx-auto max-w-[1400px] p-6">
      <header className="bps-shell-header">
        <div className="bps-shell-brand">
          <h1 className="bps-title">Baseline Planning Suite</h1>
          <p className="bps-meta m-0">
            Shell host · remotes receive currency and active user via{' '}
            <code>HostContext</code>
          </p>
        </div>

        <div className="bps-host-inline" data-testid="shell-host-context">
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
          <div className="bps-field" style={{ minWidth: 180 }}>
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
          <p className="bps-meta mb-2" data-testid="shell-context-summary">
            Showing as{' '}
            <strong className="text-bps-ink">{host.activeUser.name}</strong>
            {' · '}
            <strong className="text-bps-ink">{host.currency}</strong>
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <nav className="bps-nav-tabs" aria-label="Primary">
          <button
            type="button"
            className="bps-nav-tab"
            aria-current={view === 'people' ? 'page' : undefined}
            onClick={() => setView('people')}
          >
            People
          </button>
          <button
            type="button"
            className="bps-nav-tab"
            aria-current={view === 'delivery' ? 'page' : undefined}
            onClick={() => setView('delivery')}
          >
            Delivery
          </button>
        </nav>

        <details className="bps-resilience">
          <summary>Resilience demo</summary>
          <div className="bps-resilience__body">
            <p className="bps-meta m-0 mb-3">
              Deliberately fail a remote panel. Shell chrome and the other remote
              stay available.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="bps-btn bps-btn--secondary"
                onClick={() => setForceFailPeople((value) => !value)}
              >
                {forceFailPeople ? 'Restore People' : 'Break People'}
              </button>
              <button
                type="button"
                className="bps-btn bps-btn--secondary"
                onClick={() => setForceFailDelivery((value) => !value)}
              >
                {forceFailDelivery ? 'Restore Delivery' : 'Break Delivery'}
              </button>
            </div>
          </div>
        </details>
      </div>

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
