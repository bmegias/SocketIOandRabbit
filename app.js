var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');
var amqp = require('amqp');
var util = require('util');

var httpPort=3000;
var rabbitUrl="amqp://192.168.80.183";
var exchgName="socketIOdemo";
var queueName="socketIOdemoNodeQ";

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

function setup() {
  var exchange = conn.exchange(exchgName, {'type': 'fanout', durable: true}, function() {
    var queue = conn.queue(queueName, {durable: true, exclusive: false, autoDelete: false},
    function() {
      queue.subscribe(function(msg, headers, deliveryInfo) {
        console.log('* message received: ' + util.inspect(msg));
        io.sockets.emit('msg',msg);
      });
      queue.bind(exchange.name, '');
    });
    queue.on('queueBindOk', function() { app.listen(httpPort); });
  });

  io.sockets.on('connection', function (socket) {
    console.log('>>user connected');
    socket.on('msg', function (msg) {
      console.log('pubToRabbit ', msg);
      exchange.publish('', msg);
    });
    socket.on('disconnect', function () {
      console.log('<<user disconnected');
    });
  });

}

var conn = amqp.createConnection({url: rabbitUrl});
conn.on('ready', setup);
