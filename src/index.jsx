import React from "react";
import "./index.css";
import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css"; 
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routing.jsx";
import { WalletWrapper } from "./components/WalletWrapper.jsx";
import { PrivTokProvider } from "./components/PrivTokState.jsx";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <WalletWrapper>
            <PrivTokProvider>
                <RouterProvider router={router} />
            </PrivTokProvider>
        </WalletWrapper>
    </React.StrictMode>,
);

const reportWebVitals = (onPerfEntry) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        import("web-vitals").then(
            ({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS(onPerfEntry);
                getFID(onPerfEntry);
                getFCP(onPerfEntry);
                getLCP(onPerfEntry);
                getTTFB(onPerfEntry);
            },
        );
    }
};

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
