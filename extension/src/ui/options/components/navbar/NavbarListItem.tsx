import { JSX } from "solid-js/jsx-runtime";
import { useHashContext } from "../../context/hashContext";

export default function NavbarListItem(props: {
    hash: string;
    text: number | boolean | Node | JSX.ArrayElement | (string & {}) | null | undefined;
}) {
    const { hash, setHash } = useHashContext();

    const active = () => {
        return hash() === `#${props.hash}` || (hash() === "" && props.hash === "settings");
    };

    return (
        <li>
            <a
                href={`#${props.hash}`}
                onClick={(e) => {
                    e.preventDefault();
                    setHash(props.hash);
                }}
                class="block py-2 pl-3 pr-4  rounded   md:p-0 dark:text-white "
                classList={{
                    "text-white bg-purple-700 md:bg-transparent md:text-purple-700 md:dark:text-purple-500": active(),
                    "text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-purple-700 md:dark:hover:text-purple-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent":
                        !active(),
                }}
                aria-current={active() ? "page" : undefined}
            >
                {props.text}
            </a>
        </li>
    );
}
