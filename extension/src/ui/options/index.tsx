/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { PreferencesContextProvider } from "./context/preferencesContext";
import { HashContextProvider } from "./context/hashContext";

const root = document.getElementById("root");

render(
    () => (
        <PreferencesContextProvider>
            <HashContextProvider>
                <App />
            </HashContextProvider>
        </PreferencesContextProvider>
    ),
    root!,
);
