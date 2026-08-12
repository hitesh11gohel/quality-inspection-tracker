import { createContext, useContext } from "react";

export const LogDialogContext = createContext<() => void>(() => {});
export const useOpenLogDialog = () => useContext(LogDialogContext);
