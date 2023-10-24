// Dead code for the time being. It doesn't get into compilation but it may be helpful soon

export const buildOsuFlagUrl = (input: string): string => {
    const hexesText = input
        .split("")
        .map((letter) => letterToRegionalIndicatorHex(letter))
        .join("-");

    return "https://osu.ppy.sh/assets/images/flags/" + hexesText + ".svg";
};

export const letterToRegionalIndicatorHex = (letter: string): string => {
    return (letter.charCodeAt(0) + 0x1f1a5).toString(16);
};
