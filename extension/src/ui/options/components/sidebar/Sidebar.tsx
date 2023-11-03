import "./Sidebar.css";

export default function Sidebar() {
    return (
        <div class="sidebar">
            <h1>Options</h1>
            <ul>
                <li>
                    <button onclick={() => (window.location.hash = "home")}>Home</button>
                </li>
                <li>
                    <button onclick={() => (window.location.hash = "settings")}>Settings</button>
                </li>
            </ul>
        </div>
    );
}
