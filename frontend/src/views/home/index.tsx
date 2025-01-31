import { Box } from "@mui/material";
import { RouteComponentProps } from "@reach/router";
import AddContractForm from "../../components/add-contract-form";
import AppMenu from "../../components/app-menu";
import ContractList from "../../components/contract-list";
import { useContractsStore } from "../../store/contracts";

const HomePage = (_: RouteComponentProps) => {
  const { contracts } = useContractsStore();
  return (
    <>
      <AppMenu />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        <Box sx={{ maxWidth: "600px" }}>
          {contracts.length === 0 ? (
            <AddContractForm />
          ) : (
            <ContractList contracts={contracts} />
          )}
        </Box>
      </Box>
    </>
  );
};

export default HomePage;
