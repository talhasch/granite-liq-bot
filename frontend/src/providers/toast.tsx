import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Slide, { SlideProps } from "@mui/material/Slide";
import { useToastStore } from "../store/ui";

const SlideTransition = (props: SlideProps) => {
  return <Slide {...props} direction="down" />;
};

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { message, type, setToast } = useToastStore();
  const hideMessage = () => setToast(null, null);
  
  return (
    <>
      {children}
      {message && type && (
        <Snackbar
          TransitionComponent={SlideTransition}
          open
          onClose={hideMessage}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={hideMessage}
            variant="filled"
            severity={type}
            sx={{ width: "100%" }}
          >
            {message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default ToastProvider;
