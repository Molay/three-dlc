const config = {
  entry: {
    'index': `./src/index.js`,
  },
  module: {
    rules: [
      {
        test: /\.js$/i,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(vert|frag|glsl)$/i,
        exclude: /node_modules/,
        loader: 'raw-loader'
      }
    ]
  },
  resolveLoader: {},
  externals: {
    'three': 'require("three")',
  },
  plugins: []
};

module.exports = (env, argv) => {

  const webpack = require('webpack');
  const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
  const version = require('./package.json').version;

  if (argv.mode === 'development') {
    // config.devtool = 'source-map';
    // config.plugins.push(
    // );
  }
  else if (argv.mode === 'production') {
    config.plugins.push(
      new webpack.BannerPlugin([
        'The three.js official example expansion pack v' + version,
        'Copyright (c) ' + new Date().getFullYear() + ', Molay Chen.',
        'All rights reserved.',
        'Contact: ',
        '  molayc@gmail.com',
        '  https://www.molayc.com',
        '  https://github.com/molay',
        '',
        'LICENSE',
        'http://www.molayc.com/software/LICENSE.txt',
        '',
        'The three.js LICENSE',
        'http://threejs.org/license'
      ].join('\n')),
      // new UglifyJsPlugin({
      //   uglifyOptions: {
      //     compress: {
      //       drop_console: true,
      //       warnings: false
      //     },
      //     // mangle: {
      //     //   properties: {
      //     //     regex: /^_[^_]/
      //     //   }
      //     // }
      //   }
      // })
    );
    config.optimization = {
      minimize: false
    };
  }

  return config;
};
