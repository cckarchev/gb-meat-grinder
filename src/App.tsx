import { AppChrome } from './components/AppChrome';
import { SimulationPanels } from './components/SimulationPanels';
import { useAttackSimulation } from './hooks/useAttackSimulation';

function App() {
  const sim = useAttackSimulation();

  return (
    <AppChrome>
      <SimulationPanels sim={sim} />
    </AppChrome>
  );
}

export default App;
