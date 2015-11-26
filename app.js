/*global require:true, __dirname:true */

var conf = {
    port: 8888,
    debug: false
};


var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');

var app = express(),
    server = http.createServer(app);
    server.listen(conf.port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'app')));
