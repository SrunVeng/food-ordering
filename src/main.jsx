// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

import { ConfirmProvider } from "./components/ConfirmGuard.jsx"; // named export
import { ToastProvider } from "./ui/toast/ToastContext.jsx";   // your Toast code
import { LoadingOverlay } from "./ui/LoadingOverlay.jsx"; // your overlay

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ToastProvider>
            <ConfirmProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
                {/* Global overlay lives outside routes so it can cover everything */}
                <LoadingOverlay />
            </ConfirmProvider>
        </ToastProvider>
    </React.StrictMode>
);
