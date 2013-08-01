var Canvas = require('canvas'),
    glob = require('glob'),
    fs = require('fs'),
    rainbowDash = require('rainbow-dash'),
    leftpad = require('leftpad'),
    width = 500,
    height = 500,
    c = new Canvas(width, height),
    ctx = c.getContext('2d');

var pos = glob.sync('data/v0/bus/positions/*.geojson').map(function(p) {
    return [p.match(/(\d+).geojson/)[1], JSON.parse(fs.readFileSync(p))];
});

// var deviations = [];
var hist = {};
pos.forEach(function(p) {
    p[1].features.forEach(function(f) {
        var rdev = Math.round(f.properties.deviation / 2);
        // deviations.push(f.properties.deviation);
        if (!hist[rdev]) hist[rdev] = 0;
        hist[rdev]++;
    });
});

var doub = {};
for (var x in hist) { if (Math.abs(x * 2) < 40) doub[(+x) * 2] = hist[x]; }

fs.writeFileSync('deviation_histogram.json', JSON.stringify(doub));

