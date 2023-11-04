/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./node_modules/flowbite/**/*.js", // configure the Flowbite JS source template paths
    ],
    theme: {
        screens: {
            'xs': '520px',
            'sm': '710px',
            'md': '908px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
          }
    },
    plugins: [require("flowbite/plugin")],
};
