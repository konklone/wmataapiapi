var express = require('express'),
    fs = require('fs'),
    request = require('request'),
    cors = require('cors'),
    wmataClient = require('wmata-client'),
    app = express(),
    config = (process.env.WMATA_KEY) ? {
        keys: [process.env.WMATA_KEY]
    } : JSON.parse(fs.readFileSync('config.json')),
    predictions = {},
    stations = wmataClient.rail.stations.geojson,
    stations_length = stations.features.length,
    stationPrediction = 'http://api.wmata.com/StationPrediction.svc/json/GetPrediction/{codes}?api_key={key}',
    station_codes = stations.features.map(function(s) {
        return s.properties.code;
    }),
    code_chunks = (function() {
        var o = [], size = 50;
        while (station_codes.length) o.push(station_codes.splice(0, size));
        return o;
    })();

app.get('/', cors(), function(req, res) { res.sendfile('index.html'); });
app.get('/rail/station/', cors(), function(req, res) { res.send(stations); });
app.get('/rail/station/:code', cors(), getCode);
app.get('/rail/station/:code/prediction', cors(), getPrediction);

function getCode(req, res) {
    res.send(stations.features.filter(function(s) {
        return s.properties.code == req.params.code;
    })[0] || { error: 'Station not found' });
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
}

setInterval(minutely, 1000 * 60);
minutely();
app.listen(process.env.PORT || 3000);
