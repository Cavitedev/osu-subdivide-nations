import "./App.css";
import Sidebar from "./components/sidebar/Sidebar";
import Content from "./content/Content";
import "flowbite";

function App() {
    return (
        <div class="p-2 m-2 flex h-full transition-all duration-[0.4s] ease-[ease]">
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
