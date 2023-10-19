# Changelog

## Version 3.2.1

- Fix regional flag link on players with a different country in osu and osuworld
- Fix beatmapset loading friends and country
- Indonesia flags into coat of arms

## Version 3.2.0

- Add regional flags in wybin
- Add flags in search page
- Bulk players load (faster loads for flags)
- Fix profiles whose region is not in osu country
- Concurrent fetches for regional ranking (faster load)
- Stop caching regions and country names (already cached on browser)
- Add remaining flags (Turkey, Israel and New Zealand) + improve 1 flag from Kazakhstan

## Version 3.1.7

- Fix margin regional ranking
- New translations

## Version 3.1.6

- Add new countries: Switzerland, Greece, Estonia, Bulgaria, Slovakia

## Version 3.1.5

- Fixing matches flags updates
- Stop fetches when moving to another website (performance improvements)
- Update translations

## Version 3.1.4

- Fix Selected language on popup wasn't working properly
- Improve performance aborting calls
- Other refactoring improvements
- Update translations

## Version 3.1.3

- Update translations

## Version 3.1.2

- Adding languages, mainly Poland

## Version 3.1.1

- Added Romania, Kazakhstan, Denmark and Lithuania flags
- Partial support for Israel and New Zealand (recently added in osu world)

## Version 3.1.0

- Add support for other languages. English and Spanish are now supported (everyone can contribute on Discord)
- Add button to clear cache
- Increase cache time for osu world. 30 minutes to 12 hours for individual users fetchs, etc.
- Add support for Firefox Mobile
- Add flag to user card in mobile view
- Fix flags not loading when coming from profile
- Fix compatibility with osu!plus in beatmapset page
- Security, remove popup innerHTML and validate respektive API data to avoid malicious code injection




## Version 3.0.2

- Update flags display from contain to auto. Thanks @shdewz 
- Update country name in players whose country is supported by OsuWorld but they haven't chosen a region

## Version 3.0.1

- Fix Reskeptive score only being displayed the first time

## Version 3.0.0

- Optimize the code. No need for background script running
- Update cache system. Not it's actually stored in the extension cache
- Display score ranking on profiles thanks [Respektive](https://osu.ppy.sh/users/1023489)
- Display country names
- Flags are not adding an empty space if not found. It worked like this previously
- Change Popup font family
- Improve code startup. It should take less time to fetch the flags
- Minify the code. Now the extension takes less space and it makes it faster
- Log errors when there is a fetch request error

## Version 2.7.6

- Localize rank string
- Add Czech flags
- Remove silly log

## Version 2.7.5

- Fix ranking page again

## Version 2.7.4

- Fix duplicated names in country ranking page

## Version 2.7.3

- Fix regional flag link

## Version 2.7.2

- Missing function to check whether it's a number when navigating to the user profile

## Version 2.7.1

- Add regional flag in scores view
- Remove empty flag from profile
- Fix flag profile loading when opening tab
- Fix flags in match updates

## Version 2.7.0

- Added a lot of country flags. All flags are added except from: Philippines, Romania, Kazakhstan and Turkey
- Add rank to regional view
- Set flag spaces before loaded
- Display flags in another row on the forum so it doesn't overflow when shrinking the window
- Add support for multiplayer, spotlight and Kudosu website fixing bugs.
- Use x128 png on svg files that require over 100KB
- Update how flags are displayed. Now the full flag is displayed regardless of the format
- Fix profile flag updating when visiting other profile page
- Other minor fixes
- Fixing Norway flags

## Version 2.6.6

- Remove unnecessary columns in regional rankings
- Update x128 icon. Text is in first layer now

## Version 2.6.5

- Fix flags not being added on running matches
- Added Vietnam flags. Thanks roasted
- Change icon

## Other untracked versions

## Version 2.0.0

Flags are now fetched from osuworld

## Version 1.0.0

Flags are updated with local data