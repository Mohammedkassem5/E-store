import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from './App';


import "animate.css";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import "./index.css";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
        <ToastContainer position="bottom-right" theme="dark" />

  </StrictMode>,
)
