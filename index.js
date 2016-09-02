/*
@Des: 编译webpack-release插件,将编译的结果release同步到开发机去
*/
/*将依赖的几个库依赖进来*/
var path = require('path');
var fs = require('fs');
var util = require('util');
var request = require('request'); /*这个需要依赖*/
var Stream = require('stream');
/*
@Des: 定义文件Release 的主类，该主类会push chunks的主要内容也可以push webpack自身定义的transfer的文件
@para plugin 
{
    receiveUrl : '',
    remotePath : ''    
}
*/
function ReleasePlugin( plugin ) {
    /*记录当前的参数*/
    this.receiveUrl = plugin.receiveUrl;
    this.remotePath = plugin.remotePath;
}

/*
@Des:正式编译的函数
*/
ReleasePlugin.prototype.apply = function( compiler ) {
    /*this指针赋值*/
    var _this = this;
    /*静态资源hash的Map*/
    _this.map = {};
    /*
    @Des：编译完成之后将内容推送到服务器
    */
    compiler.plugin("after-emit", function( compilation,  callback ) {
        /*将编译后的assets指针赋值*/
        var assets = compilation.assets;
        /*获取编译后的chunks里的数据*/
        var chunks = compilation.chunks;
        /*
        @Des:比对map里的hash和新的accets里的hash,如果有改动则post
        */
        _this.assetsInforStore(_this.map, assets, chunks);
        /*让编译程序继续执行下面的操作执行*/
        callback();
    });
    
};

/*
@Des: 将assets里的hash以及相关信息保存起来，下次进行hash对比，如果hash有更新则发送服务器
@para : map 直接就是一个对象指针 
@para : assets 就是webpack的assets
@para : chunks webpack的chunks
*/
ReleasePlugin.prototype.assetsInforStore = function ( map, assets, chunks ) {
    var source;
    var _this = this;
    var Hash;
    var file;
    /*遍历新的assets*/
    for ( var o in assets ) {
        /*如果不是其属性，则跳过*/
        if ( !assets.hasOwnProperty(o) ) {
            continue;
        }     
        /*如果没有hash的则使用chunks里的数据*/
        if (!map[o] ) {
            map[o] = {
                'Hash' : assets[o]['Hash'],
                'existsAt' : assets[o]['existsAt']
            };
            source = assets[o]['source']().toString();
            new stringPost ( source, getFileName(assets[o]['existsAt']), _this.remotePath + assets[o]['existsAt'] , _this.receiveUrl );
        }      
    }
    /*遍历新的chunks*/
    chunks.forEach(function(chunk) {
        /*这里可能有坑，files里目前看到的都是只有一个*/
        file = chunk['files'][0];
        if ( !map[file] || map[file]['Hash'] != chunk.hash ) {
            source = assets[file]['source']().toString();
            new stringPost ( source, getFileName(assets[file]['existsAt']), _this.remotePath+ assets[file]['existsAt'], _this.receiveUrl );
            map[file] = {
                'Hash' : chunk.hash,
                'existsAt' : assets[file]['existsAt']
            };
        }
    });
}

/*
@Des: 获取路径中的文件名
*/
function getFileName  ( filename ) {
    var files = filename.split('/');
    return files[files.length - 1];
}


/*
@Des: post string同时转化为stream到服务器
@Para :  fileString 文件内容   
@para :  fileName  文件名
@para :  remotePath 包含文件名的路径
@para :  postUrl    文件上传的url地址 
*/
function stringPost (fileString, fileName, remotePath, postUrl ) {
    var stream = new Stream();
    stream.on('data', function(data) {
        var r = request.post(postUrl, function optionalCallback(err, httpResponse, body) {
            if(err) {
                console.log(fileName + '--fail-->' +  err);
            } else {
                console.log(fileName + '--success-->' + remotePath);
            }
        });
        var form = r.form();
        form.append('to', remotePath);
        form.append('file', data , {filename: fileName,'to':remotePath, 'path':remotePath});
    });
    stream.emit('data', fileString);
}


/*抛出给release*/
module.exports = ReleasePlugin;
