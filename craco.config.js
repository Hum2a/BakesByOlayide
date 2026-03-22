/** @see https://github.com/facebook/create-react-app/issues/11879 */
module.exports = {
  /**
   * CRA reads `PORT` from .env — if that is 5000 for the Express API, the dev UI would steal port 5000 and
   * `npm run server` would fail with EADDRINUSE. Always serve the React app on 3000 in development.
   */
  devServer: {
    port: 3000,
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
      ];
      return webpackConfig;
    },
  },
};
