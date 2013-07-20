module.exports = function(config) {
    return {
        save: function(key, string, callback) {
            callback(null);
        },
        list: function(key, callback) {
            return callback('noop');
        }
    };
};
