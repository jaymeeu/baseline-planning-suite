import {
  Component,
  type ErrorInfo,
  type ReactNode,
  Suspense,
  lazy,
  startTransition,
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

  private handleRetry = (): void => {
    this.setState({ error: null });
    this.props.onRetry();
  };

  public render(): ReactNode {
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
      <strong className="capitalize">{copy.title}</strong>
      <p className="m-0">{copy.detail}</p>
      <p className="bps-meta m-0 mt-2" style={{ color: 'inherit', opacity: 0.9 }}>
        {copy.isolationNote}
      </p>
      <button
        type="button"
        className="bps-btn bps-btn--secondary mt-3"
        onClick={onRetry}
      >
        Retry
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
  const [peopleMountKey, setPeopleMountKey] = useState(0);
  const [deliveryMountKey, setDeliveryMountKey] = useState(0);
  const [host, setHost] = useState<HostContext>(DEFAULT_HOST_CONTEXT);

  const retryPeople = (): void => {
    setPeopleMountKey((key) => key + 1);
  };

  const retryDelivery = (): void => {
    setDeliveryMountKey((key) => key + 1);
  };

  const switchView = (next: RemoteName): void => {
    startTransition(() => {
      setView(next);
    });
  };

  return (
    <div className="bps-app-shell">
      <a href="#shell-remote-main" className="bps-skip-link">
        Skip to remote content
      </a>

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

      <nav className="bps-nav-tabs mb-4" aria-label="Primary">
        <button
          type="button"
          className="bps-nav-tab"
          aria-current={view === 'people' ? 'page' : undefined}
          onClick={() => switchView('people')}
        >
          People
        </button>
        <button
          type="button"
          className="bps-nav-tab"
          aria-current={view === 'delivery' ? 'page' : undefined}
          onClick={() => switchView('delivery')}
        >
          Delivery
        </button>
      </nav>

      {/* Keep both remotes mounted so BroadcastChannel updates reach the hidden remote. */}
      <div id="shell-remote-main" tabIndex={-1}>
        <div
          className={view === 'people' ? undefined : 'hidden'}
          aria-hidden={view !== 'people'}
          data-testid="shell-people-panel"
        >
          <RemoteErrorBoundary remoteName="people" onRetry={retryPeople}>
            <RemotePanel remote="people" host={host} mountKey={peopleMountKey} />
          </RemoteErrorBoundary>
        </div>

        <div
          className={view === 'delivery' ? undefined : 'hidden'}
          aria-hidden={view !== 'delivery'}
          data-testid="shell-delivery-panel"
        >
          <RemoteErrorBoundary remoteName="delivery" onRetry={retryDelivery}>
            <RemotePanel
              remote="delivery"
              host={host}
              mountKey={deliveryMountKey}
            />
          </RemoteErrorBoundary>
        </div>
      </div>
    </div>
  );
}
