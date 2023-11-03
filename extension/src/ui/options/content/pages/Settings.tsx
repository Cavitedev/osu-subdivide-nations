export default function Settings() {
    return (
        <div class="mx-2">
            <h2 class="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Global Settings</h2>
            <div class="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow  dark:bg-gray-800 dark:border-gray-700 ">
                <div class="flex">
                    <div>
                        <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Score Ranking
                        </h5>
                        <p class="font-normal text-gray-700 dark:text-gray-400">
                            Displays Score Ranking from Repektive's API in osu! profile.
                        </p>
                    </div>
                    <div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" class="sr-only peer" />
                            <div class="w-11 h-6 bg-gray-400 peer-focus:outline-none  rounded-full  dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
