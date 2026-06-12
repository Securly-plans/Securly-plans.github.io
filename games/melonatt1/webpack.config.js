var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');

module.exports = {
  entry: [
    "webpack-dev-server/client?http://0.0.0.0:9090",
    'webpack/hot/only-dev-server',
    './lib/melonJS.js',
    './lib/plugins/debugPanel.js',
    './src/index.js'
  ],
  output: {
    path: path.join(__dirname, "public"),
    filename: 'bundle.js'
  },
  resolveLoader: {
    modulesDirectories: ['node_modules']
  },
  plugins: [
    new WebpackShellPlugin({
      onBuildStart:['node webpack/generateResources.js']
    }),
    new CopyWebpackPlugin([
      { from: './src/static/', to: path.join(__dirname, "public")},
    ]),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.IgnorePlugin(/vertx/)
  ],
  debug: true,
  devtool: 'source-map',
  resolve: {
    extensions: ['', '.js']
  },
  module: {
    loaders: [
      { test: /\.jsx?$/,    loader: 'babel', include: path.join(__dirname, 'src'), exclude: '/node_modules/' },
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
    ]
  },
  node: {
    fs: "empty"
  }
};