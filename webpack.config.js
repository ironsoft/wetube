const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");


const BASE_JS = "./src/client/js/";

module.exports = {
    // 우리가 처리하고자 한하는 파일
    entry: {
        main: BASE_JS + "main.js",
        videoPlayer: BASE_JS + "videoPlayer.js",
        recorder: BASE_JS + "recorder.js",
        commentSection: BASE_JS + "commentSection.js",
    },
    plugins: [new MiniCssExtractPlugin({
        filename: "css/styles.css",
    })],
    // 처리한 파일이 출력되는 곳
    output: {
        filename: "js/[name].js",
        path: path.resolve(__dirname, "assets"),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [["@babel/preset-env"]],
                    },
                },
            },
            {
                test: /\.scss$/,
                // 웹팩은 순서를 뒤에서부터 읽어 들어온다.
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
            },
        ],
    },
};

    