var cache = {},
    cacheTime = {},
    fresh = 1000 * 60;

// the dumbest cache in the world.
module.exports = {
    fresh: function(_) {
        fresh = _;
    },
    get: function(key) {
        console.log(cacheTime[key], (+new Date()) + fresh);
        if (cacheTime[key] > (+new Date()) - fresh) return cache[key];
    },
    set: function(key, val) {
        cache[key] = val;
        cacheTime[key] = +new Date();
        return val;
    }
};
