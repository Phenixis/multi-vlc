// Generated by CoffeeScript 1.6.2
/*
Copyright (c) 2013 Markus Kohlhase <mail@markus-kohlhase.de>
*/


(function() {
  console.log("Server : http://localhost:3000/")
  var app, express, fs, net, path, runCmd, vlcInstances, commandQueue;

  express = require('express');
  net = require('net');
  path = require('path');

  app = express();

  fs = require('fs');

  vlcInstances = require(path.join(__dirname, '..', 'clients.js'));

  // Command priorities (higher number = higher priority)
  var commandPriorities = {
    'pause': 3,
    'stop': 3,
    'next': 3,
    'prev': 3,
    'rate': 3,
    'get_title': 1
  };

  // Command queue per instance
  commandQueue = {};

  // Initialize command queues for each instance
  vlcInstances.forEach(function(instance) {
    var instanceId = instance.host + ':' + instance.port;
    commandQueue[instanceId] = [];
  });

  function processNextCommand(instanceId) {
    var queue = commandQueue[instanceId];
    if (queue.length === 0) return;

    var nextCommand = queue[0];
    var client = new net.Socket();
    var responseData = '';

    client.connect(nextCommand.instance.port, nextCommand.instance.host, function() {
      client.write(nextCommand.cmd + '\n');
    });

    client.on('data', function(data) {
      responseData += data.toString();
      if (nextCommand.cmd === 'get_title') {
        var lines = responseData.split('\n');
        lines.forEach(function(line) {
          if (line.startsWith("> ") && line !== "> ") {
            nextCommand.callback(line.slice(2).trim());
            client.destroy();
            queue.shift();
            processNextCommand(instanceId);
          }
        });
      } else {
        client.destroy();
        queue.shift();
        processNextCommand(instanceId);
      }
    });

    client.on('error', function(err) {
      console.error('Error connecting to VLC RC interface:', err);
      if (nextCommand.callback) {
        nextCommand.callback(null, err);
      }
      queue.shift();
      processNextCommand(instanceId);
    });
  }

  runCmd = function(cmd, instanceIds, callback) {
    var selectedInstances = instanceIds ? instanceIds.split(',') : [""];

    vlcInstances.forEach(function(instance) {
      var instanceId = instance.host + ':' + instance.port;
      if (selectedInstances.includes("") || selectedInstances.includes(instanceId)) {
        var priority = commandPriorities[cmd] || 2;
        var command = {
          cmd: cmd,
          instance: instance,
          callback: callback,
          priority: priority
        };

        // Insert command in queue based on priority
        var queue = commandQueue[instanceId];
        var insertIndex = queue.findIndex(item => item.priority < priority);
        if (insertIndex === -1) {
          queue.push(command);
        } else {
          queue.splice(insertIndex, 0, command);
        }

        // If this is the only command in queue, process it
        if (queue.length === 1) {
          processNextCommand(instanceId);
        }
      }
    });
  };

  app.use('/', express["static"](path.join(__dirname, '..', 'public')));

  app.get('/player/pause', function(req, res) {
    runCmd('pause', req.query.instanceId);
    return res.end();
  });

  app.get('/player/stop', function(req, res) {
    runCmd('stop', req.query.instanceId);
    return res.end();
  });

  app.get('/player/next', function(req, res) {
    runCmd('next', req.query.instanceId);
    return res.end();
  });

  app.get('/player/prev', function(req, res) {
    runCmd('prev', req.query.instanceId);
    return res.end();
  });

  app.get('/player/info', function(req, res) {
    runCmd('get_title', req.query.instanceId, function(title, error) {
      if (error) {
        console.log("Error: ", error);
        return res.status(500).json({ error: 'Failed to connect to VLC instance' });
      }
      res.json({ title: title });
    });
  });

  app.get('/player/rate', function(req, res) {
    var rate = parseFloat(req.query.rate) || 1.0;
    runCmd('rate ' + rate, req.query.instanceId);
    return res.end();
  });

  app.get('/clients/*', function(req, res) {
    res.send(JSON.stringify(vlcInstances));
    return res.end();
  });

  app.listen(3000);

}).call(this);
