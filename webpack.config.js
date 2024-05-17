const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {

    mode: 'development',
    devtool: 'eval-source-map',
    entry: '/src/index.js',
    plugins: [
          new NodePolyfillPlugin()
      ],
    output: {
        path: path.resolve(__dirname, 'src'),
        filename: 'bundle.js'
    },
    module: {
        rules: [{
          test: /.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        }]
  },
}