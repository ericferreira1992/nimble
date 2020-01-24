const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const PrerenderSpaPlugin = require('prerender-spa-plugin');
const Renderer = PrerenderSpaPlugin.PuppeteerRenderer;
const ts = require('typescript');
const configuration = require('./src/configuration.json');

const distPath = path.resolve(__dirname, 'dist');

module.exports = (env) => {
    let enviroment = loadEnvFile(env);
    return {
        mode: enviroment.production ? 'production' : 'development',
        entry: getEntries(),
        output: {
            chunkFilename: '[name].[chunkhash].bundle.js',
            filename: '[name].[chunkhash].bundle.js',
            path: distPath,
            publicPath: '/'
        },
        devServer: {
            host: '0.0.0.0',
            port: 8090,
            historyApiFallback: true
        },
        watch: !enviroment.production,
        watchOptions: { ignored: [ './node_modules' ] },
        plugins: getPlugins(enviroment),
        module: {
            rules: getRules(enviroment)
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
            alias: (function() {
                const tsconfigPath = './tsconfig.json';
                const { baseUrl, paths } = require(tsconfigPath).compilerOptions;
                const pathPrefix = path.resolve(path.dirname(tsconfigPath), baseUrl);
                const aliases = {};

                Object.keys(paths).forEach((item) => {
                    const name = item.replace("/*", "");
                    const value = path.resolve(pathPrefix, paths[item][0].replace("/*", ""));

                    aliases[name] = value;
                });

                return aliases;
            })(),
        }
    };
};

function getEntries() {
    
    let entry = { 'main': './src/index.ts' };
    
    if (configuration.vendors) {
        if (configuration.vendors.js && configuration.vendors.js.length > 0)
            entry['js-vendors'] = configuration.vendors.js.map((file) => {
                if (!file.startsWith('./'))
                    return `./${file}`;
                return file;
            });
        if (configuration.vendors.css && configuration.vendors.css.length > 0)
            entry['css-vendors'] = configuration.vendors.css.map((file) => {
                if (!file.startsWith('./'))
                    return `./${file}`;
                return file;
            });
    }
    return entry;
}

function getPlugins(enviroment) {
    let plugins = [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html',
            hash: true
        }),
        new CopyPlugin([
            { from: 'public', to: '.' },
        ]),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(enviroment)
        })
    ];
    
    let preRender = configuration['pre-render'];
    if (enviroment.production && preRender && preRender.enabled && preRender.routes && preRender.routes.length > 0) {
        plugins.push(new PrerenderSpaPlugin({
            staticDir: distPath,
            routes: preRender.routes,
            renderer: new Renderer({
                renderAfterDocumentEvent: 'render-event'
            }),
            postProcess: function (renderedRoute) {
                renderedRoute.html = renderedRoute.html.replace('<nimble-root', '<nimble-root style="visibility: hidden;"');
                renderedRoute.html = renderedRoute.html.replace(/<style type="text\/css">(.|\n)*?<\/style>/g, '');
                return renderedRoute;
            }
        }));
    }

    return plugins;
}

function getRules(enviroment) {
    let rules = [
        {
            test: /\.(ts|js)x?$/,
            exclude: /node_modules/,
            loader: 'ts-loader'
        },
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
        {
            test: /\.scss$/,
            use: [
                'style-loader',
                'css-loader',
                'sass-loader',
            ]
        },
        {
            test: /\.(svg|png|jpg)$/,
            loader: 'file-loader',
            options: {
                name:'[name].[ext]',
                outputhPath: 'assets/img/',
                publicPath: 'assets/img/'
            }
        },
        {
            test: /\.(ttf|woff|woff2)$/,
            loader: 'file-loader',
            options: {
                name:'[name].[ext]',
                outputhPath: 'assets/fonts/',
                publicPath: 'assets/fonts/'
            }
        },
        {
            test: /\.html$/,
            use: 'html-loader'
        }
    ];

    return rules;
}

function loadEnvFile(env) {
    if (env) {
        var enviroment = require(`./src/enviroments/env.${env}.js`);
        if (enviroment) {
            return enviroment;
        }
    }
    return {
        production: true
    };
}