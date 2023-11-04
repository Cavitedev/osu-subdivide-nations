/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { PreferencesContextProvider } from "./context/preferencesContext";

const root = document.getElementById("root");

render(
    () => (
        <PreferencesContextProvider>
            <App />
        </PreferencesContextProvider>
    ),
    root!,
);
