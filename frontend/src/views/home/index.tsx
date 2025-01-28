import { Box } from "@mui/material";
import AddContractForm from "../../components/add-contract-form";
import { useContractsStore } from "../../state/contracts";

const Home = () => {
  const { items } = useContractsStore((state) => state);

  if (items.length === 0) {
    return (
      <Box sx={{ maxWidth: "600px" }}>
        <AddContractForm />
      </Box>
    );
  }

  return <div>Contracts</div>;
};

export default Home;
