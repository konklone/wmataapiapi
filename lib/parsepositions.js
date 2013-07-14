var cheerio = require('cheerio');

var numberValues = { lon: true, lat: true, deviation: true };

module.exports = function(xmlStr) {
    var $ = cheerio.load(xmlStr);
    var output = [];
    $('BusPosition').each(function(i, elem) {
        var child = {};
        $(elem).children().each(function(j, sib) {
            child[sib.name.toLowerCase()] = (sib.name.toLowerCase() in numberValues) ?
                parseFloat($(sib).text()) : $(sib).text();
        });
        output.push(child);
    });
    return output;
};
