
export type TFlagItems = {
    id: string;
    item: HTMLElement;
}[];// Quotes needed for special characters
export const flagStyle = 'background-image: url("$flag"); background-size: auto 100%';
const marginLeftStyle = "margin-left: 4px";
export const flagStyleWithMargin = flagStyle + ";" + marginLeftStyle;
export const noFlag = "https://upload.wikimedia.org/wikipedia/commons/4/49/Noflag2.svg";

