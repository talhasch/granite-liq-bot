import { Box, Typography } from "@mui/material";
import { RouteComponentProps, useParams } from "@reach/router";
import AppMenu from "../../components/app-menu";
import useTranslation from "../../hooks/use-translation";
import { useContractsStore } from "../../store/contracts";

const ContractPage = (_: RouteComponentProps) => {
  const { contracts } = useContractsStore();
  const params = useParams();
  const { id } = params;
  const [t] = useTranslation();

  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    return <Typography>{t("Not found")}</Typography>;
  }

  return (
    <>
      <AppMenu network={contract.network} />
      <Box sx={{ ml: "12px", mr: "12px" }}>
        <Typography variant="h6">{id}</Typography>
      </Box>
    </>
  );
};

export default ContractPage;
