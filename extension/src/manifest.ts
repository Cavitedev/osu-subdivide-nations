import pkg from "../package.json";

const sharedManifest: Partial<chrome.runtime.ManifestBase> = {
  content_scripts: [
    {
        matches: [
            "https://osu.ppy.sh/*"
        ],
        js: [
            "src/content-script/osu/content.ts"
        ]
    },
    {
        matches: [
            "https://wybin.xyz/*"
        ],
        js: [
            "src/content-script/wybin/content.ts"
        ]
    }
],
description: "__MSG_appDesc__",

"default_locale": "en",
  icons: {
    16: "icons/16.png",
    32: "icons/32.png",
    48: "icons/48.png",
    128: "icons/128.png",
  },

  permissions: ["tabs", "storage",]
};

const browserAction = {
  default_icon: {
    16: "icons/16.png",
    32: "icons/32.png",
  },
  default_popup: "src/ui/popup/index.html",
};

const ManifestFirefox = {
  ...sharedManifest,

  browser_action: browserAction,
  // options_ui: {
  //   ...sharedManifest.options_ui,
  //   chrome_style: false,
  // },
  permissions: [...sharedManifest.permissions, "https://osuworld.octo.moe/api/*",
  "https://score.respektive.pw/*",]
};

const ManifestChromium = {
  ...sharedManifest,
  action: browserAction,
  web_accessible_resources: [
    {
        matches: [
            "https://osu.ppy.sh/*",
            "https://wybin.xyz/*"
        ],
        resources: [
            "flags.json",
            "_locales/**/*",
        ]
    }
  ],
};

export type TtargetBrowser = "chromium" | "firefox";


export function getManifest(browserTarget: TtargetBrowser): chrome.runtime.ManifestV2 | chrome.runtime.ManifestV3 {
  const manifest = {
    author: pkg.author,
    description: pkg.description,
    name: pkg.displayName ?? pkg.name,
    version: pkg.version,
  };

  if (browserTarget === "firefox") {
    return {
      ...manifest,
      ...ManifestFirefox,
      manifest_version: 2,
    };
  }

  if (browserTarget === "chromium") {
    return {
      ...manifest,
      ...ManifestChromium,
      manifest_version: 3,
    };
  }

  throw new Error(
    `Missing manifest definition for browser ${browserTarget}`
  );
}