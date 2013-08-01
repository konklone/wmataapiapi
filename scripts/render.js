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

ctx.fillStyle = '#000';
ctx.fillRect(0, 0, width, height);

var bbox = [
    [-77.191, 39.055],
    [-76.808, 38.780]
];

var hexOut = rainbowDash({ outputFormat: 'hex' }, {
    0: '#00ffff',
    1: '#ff11ff'
});

var gwidth = bbox[1][0] - bbox[0][0];
var gheight = bbox[1][1] - bbox[0][1];

function proj(p) {
    return [
        ~~(((p.geometry.coordinates[0] - bbox[0][0]) / gwidth) * width),
        ~~(((p.geometry.coordinates[1] - bbox[0][1]) / gheight) * height)];
}

var x = 0, j = 0;

pos.forEach(function(p, i) {

    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.01;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 1;
    ctx.fillStyle = hexOut(i / pos.length);
    p[1].features.forEach(function(_) {
        var pt = proj(_);
        ctx.fillRect(pt[0], pt[1], 1, 1);
    });
    if ((j++ % 20) === 0) {
        fs.writeFileSync('frames/' + leftpad(x++, 10) + '.png', c.toBuffer());
    }
});
// fs.writeFileSync('big.png', c.toBuffer());
