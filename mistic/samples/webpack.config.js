const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const configuration = require('./src/configuration.json');

const distPath = path.resolve(__dirname, 'dist');

let entry = {
	'main': './src/index.ts',
};

if (configuration.vendors) {
	if (configuration.vendors.js && configuration.vendors.js.length > 0)
		entry['js-vendors'] = configuration.vendors.js.map((file) => {
			if (!file.startsWith('./src/'))
				return `./src/${file}`;
			return file;
		});
	if (configuration.vendors.css && configuration.vendors.css.length > 0)
		entry['css-vendors'] = configuration.vendors.css.map((file) => {
			if (!file.startsWith('./src/'))
				return `./src/${file}`;
			return file;
		});
}

let config = {
	entry: entry,
	output: {
        chunkFilename: '[name].[chunkhash].bundle.js',
		filename: '[name].[chunkhash].bundle.js',
		path: distPath
	},
	devServer: {
		host: '0.0.0.0',
		port: 8090
	},
	watch: false,
	watchOptions: { ignored: [ './node_modules' ] },
	plugins: [
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: './src/index.html',
			hash: true
		}),
		new CopyPlugin([
			//{ from: './public', to: './' },
		])
	],
	module: {
		rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
			{
				test:/\.scss$/,
				use: [ "style-loader", "css-loader", "sass-loader" ]
			},
			{
				loader: 'file-loader',
				test: /\.(css|ttf|eot|svg|png|jpg)$/
			},
			{
				test: /\.html$/,
				use: [ {
					loader: 'html-loader',
					options: {
					}
				}],
			}
		]
	},
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};
module.exports = config;