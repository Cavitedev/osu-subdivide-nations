import DarkModeIcon from "@src/ui/icons/darkMode.svg";
import LightModeIcon from "@src/ui/icons/lightMode.svg";
import { usePreferencesContext } from "../../context/preferencesContext";

export default function ThemeToggle() {
    const { preferences, setPreference } = usePreferencesContext();

    const onThemeClick = () => {
        setPreference("darkMode", !preferences.darkMode);
    };

    return (
        <div class="block px-4 ">
            <button
                type="button"
                class="p-2 mr-1 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 "
                onClick={onThemeClick}
            >
                <span class="sr-only">View notifications</span>
                <svg
                    class="w-5 h-5 "
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    {preferences.darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </svg>
            </button>
        </div>
    );
}
