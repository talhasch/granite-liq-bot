import { useEffect } from "react";
import Layout from "./layout";
import HomePage from "./views/home";
import "./App.css";
import Providers from "./providers";
import { useContractsStore } from "./store/contracts";
import useToast from "./hooks/use-toast";

function App() {
  const { initialized, loading: contractsLoading, loadContracts } = useContractsStore();
  const [showMessage] = useToast();

  useEffect(() => {
    if (!initialized) {
      loadContracts().catch((error) => {
        showMessage(error.message, 'error');
      });
    }
  }, [loadContracts, initialized, showMessage]);

  const loading = contractsLoading || !initialized;

  if(loading) {
    return null;
  }

  return (
    <Providers>
      <Layout>
        <HomePage />
      </Layout>
    </Providers>
  );
}

export default App;
