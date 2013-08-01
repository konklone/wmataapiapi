var express = require('express'),
    fs = require('fs'),
    request = require('request'),
    cors = require('cors'),
    cronJob = require('cron').CronJob,
    wmataClient = require('wmata-client');

var USE_HISTORY = false;

var parsePositions = require('./lib/parsepositions'),
    dcache = require('./lib/dumbcache'),
    busgeojson = require('./lib/busgeojson');

var API_URLS = require('./data/api.json');

var app = express(),
    config = (process.env.WMATA_KEY) ? {
        keys: [process.env.WMATA_KEY],
        s3key: process.env.S3_KEY,
        s3secret: process.env.S3_SECRET,
        s3bucket: process.env.S3_BUCKET
    } : require('./config.json');

var history = (config.s3key && USE_HISTORY) ? require('./lib/history')(config) :
    require('./lib/historynoop')(config);

// the mashery-created 'io docs'
// http://developer.wmata.com/io-docs
var predictions = {},
    current = {},
    stations = wmataClient.rail.stations.geojson,
    stations_length = stations.features.length,
    // the station prediction api
    station_codes = stations.features.map(function(s) {
        return s.properties.code;
    }),
    // so you can't request a lot of codes from the API at the same time.
    // this is a fancy-dancy way to chop up the long list of codes into
    // 50-code segments
    code_chunks = (function() {
        var o = [], size = 50;
        while (station_codes.length) o.push(station_codes.splice(0, size));
        return o;
    })();

app.get('/', cors(), function(req, res) { res.sendfile('web/index.html'); });
app.get('/rail/station/', cors(), function(req, res) { res.jsonp(stations); });
app.get('/rail/station/:code', cors(), getCode);
app.get('/rail/station/:code/prediction', cors(), getPrediction);
app.get('/bus/position/', cors(), getBusPosition);
app.get('/bus/position.geojson', cors(), getBusPosition);
app.get('/bus/position/history/', cors(), getBusHistoryList);

function getCode(req, res) {
    res.jsonp(stations.features.filter(function(s) {
        return s.properties.code == req.params.code;
    })[0] || { error: 'Station not found' });
}

function getBusPosition(req, res) {
    return res.send(busgeojson(current.busPositions));
}

function getBusHistoryList(req, res) {
    if (dcache.get('v0/bus/positions/')) {
        console.log('wmataapiapi: [web] list cache hit');
        return res.jsonp(dcache.get('v0/bus/positions/'));
    } else {
        console.log('wmataapiapi: [web] list cache miss');
        history.list('v0/bus/positions/', function(err, list) {
            if (err) return res.jsonp(err);
            console.log('wmataapiapi: [web] list cache save');
            res.jsonp(dcache.set('v0/bus/positions/', list.Contents.map(function(c) {
                return {
                    url: 'http://' + config.s3bucket + '.s3.amazonaws.com/' + c.Key,
                    key: c.Key,
                    time: parseInt(c.Key.match(/(\d+)\.geojson/)[0], 10) * 1000 * 60
                };
            })));
        });
    }
}

function getPrediction(req, res) {
    if (req.params.code === 'all') return res.send(predictions);
    return res.jsonp(predictions[req.params.code] || {
        error: 'Station and predictions not found'
    });
}

function minutely() {
    console.log('wmataapiapi: minutely task started');
    // the minute-time
    var stamp = Math.floor(+new Date() / (1000 * 60));

    code_chunks.forEach(function(chunk, i) {
        request({
            uri: API_URLS.stationPrediction
                .replace('{key}', config.keys[0])
                .replace('{codes}', chunk.join(',')),
            json: true
        }, function(err, resp, body) {
            if (err) return;
            var groups = {};
            body.Trains.forEach(function(t) {
                if (!groups[t.LocationCode]) groups[t.LocationCode] = [];
                t.retrieved = +new Date();
                groups[t.LocationCode].push(t);
            });
            for (var code in groups) predictions[code] = groups[code];
            console.log('wmataapiapi: [train] batch %s done', i);
        });
    });

    request({
        uri: API_URLS.busPosition
            .replace('{key}', config.keys[0])
    }, function(err, resp, body) {
        if (err) return console.error('wmataapiapi: [bus] error %s', err);
        current.busPositions = parsePositions(body);
        console.log('wmataapiapi: [bus] positions logged');
        history.save(
            '/v0/bus/positions/' + stamp + '.geojson',
            JSON.stringify(busgeojson(current.busPositions)), function(err) {
                if (err) console.error('wmataapiapi: [bus] error saving to s3');
                else console.log('wmataapiapi: [bus] saved to s3');
            });
    });
}

new cronJob('0 * * * * *', minutely, null, true);

app.listen(process.env.PORT || 3000);
