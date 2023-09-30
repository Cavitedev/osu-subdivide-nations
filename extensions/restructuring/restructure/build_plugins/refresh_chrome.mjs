import open from "open";

export const refreshChrome = {
  name: "refresh-chrome",
  setup(build) {
    build.onEnd(async (result) => {
      console.log("refreshing chrome");
      open("http://reload.extensions", { app: { name: "chrome", arguments:['--headless'] } });
    });
  },
};
