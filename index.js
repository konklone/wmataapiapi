var express = require('express'),
    fs = require('fs'),
    request = require('request'),
    cors = require('cors'),
    parsePositions = require('./lib/parsepositions'),
    wmataClient = require('wmata-client');

var app = express(),
    config = (process.env.WMATA_KEY) ? {
        keys: [process.env.WMATA_KEY]
    } : JSON.parse(fs.readFileSync('config.json'));

// the mashery-created 'io docs'
// http://developer.wmata.com/io-docs
var predictions = {},
    current = {},
    stations = wmataClient.rail.stations.geojson,
    stations_length = stations.features.length,
    // the station prediction api
    stationPrediction = 'http://api.wmata.com/StationPrediction.svc/json/GetPrediction/{codes}?api_key={key}',
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
    })(),
    busPosition = 'http://api.wmata.com/Bus.svc/BusPositions?api_key={key}';

app.get('/', cors(), function(req, res) { res.sendfile('index.html'); });
app.get('/rail/station/', cors(), function(req, res) { res.send(stations); });
app.get('/rail/station/:code', cors(), getCode);
app.get('/rail/station/:code/prediction', cors(), getPrediction);
app.get('/bus/position/', cors(), getBusPosition);
app.get('/bus/position.geojson', cors(), getBusPosition);

function getCode(req, res) {
    res.send(stations.features.filter(function(s) {
        return s.properties.code == req.params.code;
    })[0] || { error: 'Station not found' });
}

function getBusPosition(req, res) {
    return res.send(current.busPositions ? {
        type: 'FeatureCollection',
        features: current.busPositions.map(function(p) {
            var props = p;
            props.title = p.vehicleid + ', ' + p.routeid;
            props['marker-symbol'] = 'bus';
            props['marker-color'] = '#15a';
            return {
                type: 'Feature',
                properties: p,
                geometry: {
                    type: 'Point',
                    coordinates: [p.lon, p.lat]
                }
            };
        })
    } : {type:'FeatureCollection',features:[]});
}

function getPrediction(req, res) {
    if (req.params.code === 'all') return res.send(predictions);
    return res.send(predictions[req.params.code] || { error: 'Station and predictions not found' });
}

function delay(i) { return (i / stations_length) * 60 * 1000; }

function minutely() {
    code_chunks.forEach(function(chunk) {
        request({
            uri: stationPrediction
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
        });
    });

    request({
        uri: busPosition
            .replace('{key}', config.keys[0])
    }, function(err, resp, body) {
        if (err) return;
        current.busPositions = parsePositions(body);
    });
}

setInterval(minutely, 1000 * 60);
minutely();
app.listen(process.env.PORT || 3000);
