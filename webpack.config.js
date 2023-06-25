const path = require('path');
module.exports = {
  entry: './starter/public/js/index.js',
  output: {
    path: path.resolve(__dirname, './starter/public/js/'),
    filename: 'bundle.js',
  },
  resolve: {
    fallback: { crypto: false },
  },
  //mode: 'development', // режим
};
