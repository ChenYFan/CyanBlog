const path = require('path');
module.exports = {
    entry: './CyanAcc/index.js',
    output: {
        filename: 'CyanAcc.js',
        path: path.resolve(__dirname, 'public')
    },
    mode: 'production'
    //mode: 'development'
}