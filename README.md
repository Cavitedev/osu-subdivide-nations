# Osu Subdivision Flags

This project aims to display the regional flags of players on the website and its region name through an extension.

Feedback and contact in [Discord](https://discord.gg/YjH34wpadx)

Data provided by [osuworld](https://osuworld.octo.moe/)

## Download

- [Chrome extension](https://chrome.google.com/webstore/detail/ehdehfcjlmekjdolbbmjgokdfeoocccd)
- [Firefox extension](https://addons.mozilla.org/en-US/firefox/addon/osu-subdivide-nations/)
- [Microsoft edge add-ons (chrome)](https://microsoftedge.microsoft.com/addons/detail/osu-subdivide-nations/mdbdfpbifeapmnkolpbcppeibblipjal)

## Flags

You can add missing flags by creating a pull request or by sending the proposed changes over [Discord](https://discord.gg/YjH34wpadx)



## Supported Websites

### Osu! Website

These are some examples of websites the extension is applied

- [Matches](https://osu.ppy.sh/community/matches/110067650)
- [Rankings](https://osu.ppy.sh/rankings/osu/performance?country=ES)
- [Profile](https://osu.ppy.sh/users/4871211/fruits)
- [Friends](https://osu.ppy.sh/home/friends)
- [Forum](https://osu.ppy.sh/community/forums/topics/1686524?n=3)
- [Beatmap](https://osu.ppy.sh/beatmapsets/1508588#fruits/3734628)

## Inner Projects

### extensions

Folder with all the extensions related to this project

Code in shared folder needs to be copied alongisde the chrome/firefox manifest into another folder (e.g chrome_dev) before loading it

### dataFetcher

Jupyter Notebook to automatically gather and structure data needed somewhere else

### console

Utils code that is used to update the view on pages related to this project
