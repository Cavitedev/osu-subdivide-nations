export default (options = {}) => ({
  name: "onEndConsole",
  setup(build) {
    build.onEnd(result => {
        console.log(`build ended with ${result.errors.length} errors`)
      })
  },
});
