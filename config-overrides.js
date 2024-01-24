const webpack = require("webpack")

module.exports = function override(config, env) {
  //do stuff with the webpack config...
  config.experiments = {
    asyncWebAssembly: true,
  };

  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve("buffer"),
  }

  config.module.rules
    .find((i) => "oneOf" in i)
    .oneOf.find((i) => i.type === "asset/resource")
    .exclude.push(/\.wasm$/);

  config.resolve.extensions = [...config.resolve.extensions, ".ts", ".js"]
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]

  return config
}