import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { BUSINESS } from "./config/business";
import { captureInstallPrompt } from "./lib/installPrompt";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/hanken-grotesk";
import "./index.css";

document.title = BUSINESS.documentTitle;
captureInstallPrompt();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
