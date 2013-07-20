module.exports = function(config) {
    return {
        save: function(key, string, callback) {
            callback(null);
        },
        list: function(key, callback) {
            return callback({ error: 'list is not available, in noop mode' });
        }
    };
};
