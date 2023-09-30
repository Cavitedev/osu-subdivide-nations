

export const refreshChrome = {
  name: "refresh-chrome",
  setup(build) {
    build.onEnd((result) => {
      console.log("refreshing chrome");

    });
  },
};
