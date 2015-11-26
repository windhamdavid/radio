var express = require('express'),
    http = require('http')

var app = express(),
    server = http.createServer(app);
    server.listen(conf.port);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

