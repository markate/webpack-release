# webpack-release
##功能描述：使用开发机开发时，自动将修改过的文件同步到开发机对应的目录 － 类似fis release
##安装说明：
   npm install webpack-release
##使用说明：

    plugins: [
        new ReleasePlugin({
            receiveUrl:'http://10.6.131.78:8899/receiver',
            remotePath:'/home/markate/test'
        })
    ]

    配合fis-dev-server使用效果更佳