import { Component, type ErrorInfo, type ReactNode, Suspense, lazy, useState } from 'react';
import './index.css';

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
    <div
      role="alert"
      className="border border-red-800 p-4 text-red-900"
    >
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
    <div className="p-6 font-sans text-neutral-900">
      <header className="mb-6">
        <h1 className="mb-1 text-2xl font-semibold">Baseline Planning Suite</h1>
        <p className="mb-3 text-neutral-600">
          Shell host — currency and active user will be owned here later.
        </p>
        <nav className="flex flex-wrap gap-3">
          <button
            type="button"
            className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5"
            onClick={() => setView('people')}
          >
            People
          </button>
          <button
            type="button"
            className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5"
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
