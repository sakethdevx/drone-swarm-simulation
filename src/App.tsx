import CanvasEnvironment from './components/Scene/CanvasEnvironment';
import Dashboard from './components/UI/Dashboard';

function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 text-zinc-50 font-sans">
      <CanvasEnvironment />
      <Dashboard />
    </div>
  );
}

export default App;
