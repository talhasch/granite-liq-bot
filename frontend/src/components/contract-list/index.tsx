import { Box, Typography, useTheme } from "@mui/material";
import { grey } from "@mui/material/colors";
import ThemedBox from "../../components/themed-box";
import useTranslation from "../../hooks/use-translation";
import NetworkChip from "../../components/network-chip";
import { useMemo, useCallback } from "react";
import { Contract } from "../../types";

const ContractList = ({ contracts }: { contracts: Contract[] }) => {
  const [t] = useTranslation();
  const theme = useTheme();

  const itemClicked = useCallback((id: string) => {
    console.log(id);
  }, []);

  const items = useMemo(() => {
    return contracts.map((c, n) => (
      <Box
        key={c.id}
        sx={{
          cursor: "pointer",
          padding: "6px",
          marginBottom: n === contracts.length - 1 ? null : "6px",
          borderRadius: "4px",
          bgcolor: theme.palette.mode === "light" ? grey[50] : grey[900],
          ":hover": {
            bgcolor: "transparent",
          },
        }}
        onClick={() => itemClicked(c.id)}
      >
        <Box
          sx={{
            mb: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography fontWeight="bold">{c.name}</Typography>
          <NetworkChip network={c.network} />
        </Box>
        <Box sx={{ overflowWrap: "break-word" }}>
          <Typography fontSize="90%" color={grey[600]}>
            {c.address}
          </Typography>
        </Box>
      </Box>
    ));
  }, [contracts, theme, itemClicked]);

  return (
    <ThemedBox sx={{ maxWidth: "600px" }}>
      <Typography variant="h6">{t("Contracts")}</Typography>
      <Typography fontSize="small" sx={{ mb: "20px", color: grey[600] }}>
        {t("List of liquidation contracts you have added.")}
      </Typography>
      {items}
    </ThemedBox>
  );
};

export default ContractList;
