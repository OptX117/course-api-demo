const path = require('path');
const nodeExternals = require('webpack-node-externals');



module.exports = {
    // Change to your "entry-point".
    entry: './src/app',
    target: 'node',
    mode: process.env.NODE_ENV || 'production',
    node: {
        __dirname: false,
        __filename: false,
    },
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'bin'),
        filename: 'app.js'
    },
    externals: [nodeExternals()],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [{
            // Include ts, tsx, js, and jsx files.
            test: /\.(ts|js)x?$/,
            exclude: /node_modules/,
            loader: 'ts-loader',
        }],
    },
    optimization: {
        minimize: false
    }
};
