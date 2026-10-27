import { createContext, useContext } from "react";

export const PrintStationContext = createContext(null);

export const usePrintStation = () => useContext(PrintStationContext);
