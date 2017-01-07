var express = require('express');
var expressHandlebars  = require('express-handlebars');
var http = require('http');
var redis = require('redis');
var bodyParser = require('body-parser');
var async = require('async');

var PORT = 8000;
var urlencodedParser = bodyParser.urlencoded({ extended: true });

var client = redis.createClient({
	'host': 'redis'
});

var app = express();
app.engine('html', expressHandlebars());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static('css'));

app.get('/', function(req, res) {
	res.render('index', {rv: client.server_info.redis_version});
});

app.get('/results', function(req, res) {
	getVotes(function(results){
		res.render('results', results);
	});
});
//render results page======================================
app.post('/results', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)
  vote(req.body.tech, function(){
	  getVotes(function(result){
		  res.render('results', result);
	  });
  });
});

var getVotes = function (done){
	var tmp = ['node','java','dotnet'];
	var result = {count:0};
	async.each(tmp, function(name, cb){
		client.get(name, function(err, reply){
			if(!err && reply){
				result[name] = parseInt(reply, 10);
				result.count += result[name];
				//if(name != 'node')
				//	result[name] = 0;
			}
			else
				result[name] = 0;
			cb();
		});
	}, function() {
		done(result);
	});
};

var vote = function (key, done ){
	var count = 0;
	client.get(key, function(err, reply){
		if (!err && reply) count = reply;
		count++;
		client.set(key, count);
		done(count);
	});
};



http.Server(app).listen(PORT, function() {
    console.log("HTTP server listening on port %s", PORT);
});

process.on('SIGTERM', function () {
	process.exit(0);
});
