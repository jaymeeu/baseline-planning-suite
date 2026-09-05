import './index.css';

export function App() {
  return (
    <main className="p-6 font-sans text-neutral-900">
      <h1 className="mb-1 text-2xl font-semibold">Delivery</h1>
      <p className="text-neutral-600">
        Planning and staffing remote — bootstrap placeholder.
      </p>
      <p data-testid="delivery-mode">
        Mode: standalone or hosted via Module Federation.
      </p>
    </main>
  );
}

export default App;
