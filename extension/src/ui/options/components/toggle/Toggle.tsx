export default function Toggle(props: {
    value: string;
    checked: boolean;
    onChange: (
        e: Event & {
            currentTarget: HTMLInputElement;
            target: HTMLInputElement;
        },
    ) => void;
}) {
    return (
        <label class="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" value={props.value} checked={props.checked} onChange={props.onChange} class="peer sr-only" />
            <div class="h-6 w-11 rounded-full bg-gray-400  after:absolute  after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
        </label>
    );
}
