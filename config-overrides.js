const webpack = require("webpack")
let commitHash;
try {
  commitHash = require('child_process')
    .execSync('git rev-parse --short HEAD')
    .toString()
    .trim();
} catch (e) {
  commitHash = 'unknown';
}

module.exports = function override(config, env) {
  //do stuff with the webpack config...
  config.experiments = {
    asyncWebAssembly: true,
    topLevelAwait: true,
  };

  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve("buffer"),
    module: false,
    path: false,
    fs: false,
    url: false,
    crypto: false,
  }

  config.module.rules
    .find((i) => "oneOf" in i)
    .oneOf.find((i) => i.type === "asset/resource")
    .exclude.push(/\.wasm$/);

  config.module.rules.unshift({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false, // disable the behavior
    },
  });

  config.resolve.extensions = [...config.resolve.extensions, ".ts", ".js"]
  config.plugins = [
    ...config.plugins,
    new webpack.DefinePlugin({
      __COMMIT_HASH__: JSON.stringify(commitHash)
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]

  return config
}