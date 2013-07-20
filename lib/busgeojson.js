module.exports = function(busPositions) {
    return busPositions ? {
        type: 'FeatureCollection',
        features: busPositions.map(function(p) {
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
    } : {
        type:'FeatureCollection',
        features: []
    };
};
