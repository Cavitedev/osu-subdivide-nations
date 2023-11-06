import "./App.css";
import Navbar from "./components/navbar/Navbar";
import Content from "./content/Content";
import "flowbite";
import { usePreferencesContext } from "./context/preferencesContext";
import { createEffect } from "solid-js";

function App() {
    const { preferences } = usePreferencesContext();

    createEffect(() => {
        const darkMode = preferences.darkMode;
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    });

    return (
        <div >
            <Navbar />
            <Content />
        </div>
    );
}

export default App;
