import "./App.css";
import Sidebar from "./components/sidebar/Sidebar";
import Content from "./content/Content";

function App() {
    return (
        <div class="flex h-full transition-all duration-[0.4s] ease-[ease] m-2 p-2;">
            <Sidebar />
            <Content />
            {/* <div>
                <h1>Vite + Solid + XD</h1>
                <div class="card">
                    <button onClick={() => setCount((count) => count + 1)}>count is {count()}</button>
                    <p>
                        Edit <code>src/App.tsx</code> and save to test HMR
                    </p>
                </div>
                <p class="read-the-docs">Click on the Vite and Solid logos to learn more</p>
            </div> */}
        </div>
    );
}

export default App;
