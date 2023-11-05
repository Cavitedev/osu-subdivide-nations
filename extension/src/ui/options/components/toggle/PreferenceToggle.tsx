import { Tpreferences } from "@src/utils/preferences";
import { usePreferencesContext } from "../../context/preferencesContext";
import Toggle from "./Toggle";

export default function PreferenceToggle(props: { preference: keyof Tpreferences }) {
    const preferencesContext = usePreferencesContext();

    return (
        <Toggle
            checked={!!preferencesContext.preferences[props.preference]}
            onChange={(e) => {
                preferencesContext.setPreference(props.preference, e.currentTarget.checked);
            }}
        />
    );
}
