var knox = require('knox');

// a basic abstraction around knox to let wmataapiapi save
// historical data
module.exports = function(config) {
    var client = knox.createClient({
        key: config.s3key,
        secret: config.s3secret,
        bucket: config.s3bucket
    });

    return {
        save: function(key, string, callback) {
            var req = client.put(key, {
                'Content-Length': string.length,
                'Content-Type': 'application/json',
                'x-amz-acl': 'public-read'
            });
            req.on('response', function(res){
                if (200 == res.statusCode) callback(null, res);
                else callback(res);
            });
            req.end(string);
        },
        list: function(prefix, callback) {
            client.list({ prefix: prefix }, function(err, data) {
                if (err) return callback(err);
                else callback(null, data);
            });
        }
    };
};
