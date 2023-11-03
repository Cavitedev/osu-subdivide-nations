import "flowbite";

export default function Settings() {
    return (
        <div>
            <h1>Header</h1>
            <div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" class="sr-only peer" />
                    <div class="w-11 h-6 bg-gray-400 peer-focus:outline-none  rounded-full  dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    <span class="ml-3 text-sm font-medium dark:text-gray-300">Toggle me</span>
                </label>
            </div>
        </div>
    );
}
