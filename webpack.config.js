const webpack = require('webpack');

module.exports = {
  target: "webworker",
  entry: "./index.js",
  mode: "production",
  plugins: [
    new webpack.ProvidePlugin({
      iconv: 'iconv-lite',
      cheerio: 'cheerio'
    }),
  ],
}