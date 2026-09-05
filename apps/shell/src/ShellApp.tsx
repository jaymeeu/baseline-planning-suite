import { Component, type ErrorInfo, type ReactNode, Suspense, lazy, useState } from 'react';

type RemoteName = 'people' | 'delivery';

const PeopleApp = lazy(async () => {
  const mod = await import('people/App');
  return { default: mod.default ?? mod.App };
});

const DeliveryApp = lazy(async () => {
  const mod = await import('delivery/App');
  return { default: mod.default ?? mod.App };
});

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
    <div role="alert" style={{ border: '1px solid #b00020', padding: '1rem' }}>
      <strong>{remoteName} failed to load</strong>
      <p>{message}</p>
      <p>Shell remains available. Other remotes are unaffected.</p>
    </div>
  );
}

export function ShellApp() {
  const [view, setView] = useState<RemoteName>('people');
  const [forceFailPeople, setForceFailPeople] = useState(false);
  const [forceFailDelivery, setForceFailDelivery] = useState(false);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1>Baseline Planning Suite</h1>
        <p>Shell host — currency and active user will be owned here later.</p>
        <nav style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setView('people')}>
            People
          </button>
          <button type="button" onClick={() => setView('delivery')}>
            Delivery
          </button>
          <button type="button" onClick={() => setForceFailPeople((value) => !value)}>
            {forceFailPeople ? 'Restore People' : 'Break People'}
          </button>
          <button
            type="button"
            onClick={() => setForceFailDelivery((value) => !value)}
          >
            {forceFailDelivery ? 'Restore Delivery' : 'Break Delivery'}
          </button>
        </nav>
      </header>

      {view === 'people' ? (
        <RemoteErrorBoundary remoteName="people" forceFail={forceFailPeople}>
          <Suspense fallback={<p>Loading People…</p>}>
            <PeopleApp />
          </Suspense>
        </RemoteErrorBoundary>
      ) : (
        <RemoteErrorBoundary remoteName="delivery" forceFail={forceFailDelivery}>
          <Suspense fallback={<p>Loading Delivery…</p>}>
            <DeliveryApp />
          </Suspense>
        </RemoteErrorBoundary>
      )}
    </div>
  );
}
