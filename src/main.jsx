import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { BUSINESS } from "./config/business";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/hanken-grotesk";
import "./index.css";

document.title = BUSINESS.documentTitle;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
