# wmata apiapi

Testing instance: http://secret-wildwood-1777.herokuapp.com/

```
/rail/station/
/rail/station/:code
/rail/station/:code/prediction
/rail/station/all/prediction
/bus/position/
/bus/position/history/
/bus/position.geojson
```

Each endpoint supports both [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
and [JSONP](http://en.wikipedia.org/wiki/JSONP), so the server can be used by
purely client-side applications.

It's an API on an API on an API.

## Development

    git clone git@github.com:tmcw/wmataapiapi.git
    npm install

### API Key

[Register for an API key at developer.wmata.com](http://developer.wmata.com/).

The application receives API keys either through environment variables or a
`config.json` file. A basic `config.json` looks like

```js
{
    "keys": [
        "YOUR_API_KEY"
    ]
}
```

The **historical component** of the API requires [Amazon S3](http://aws.amazon.com/s3/),
but you don't need to use it. To use it, add
`s3key`, `s3secret`, and `s3bucket` to your `config.json` file. To not use it,
don't, and the history API will be noop.

### Running

    node index.js

To run on [Heroku](https://www.heroku.com/), create a heroku server, and push
wmataapiapi to it. Then add your key like

    heroku config:add WMATA_KEY=YOUR_KEY_VALUE

This way you don't have to commit your key publicly.

## Context

The DC government writes/contracts/maintains a system that does stuff like
bus and rail predictions, simple stuff like finding local stops, and semi-realtime
stuff like problems with elevators and so on.

They then use [Mashery](http://www.mashery.com/) to 'maintain' this API, which means
severely limiting API access - 15,000 calls a day.

15,000 may seem like a large number, but there are 11,305 bus stops and
90 rail stations, and 24 hours in a day, so to poll minutely for bus stop
predictions would take 11305*60*24 requests a day, or around 1,085 API keys worth.

This handles rail stations, which require 9 keys with a naive approach but
by just doing big multi-stop queries we can bring it down to one key - 60*24*2
requests a day worth.

Ideally in the future, Mashery is removed entirely and we have a simpler, less
dynamic system with minutely-or-faster queries. In the meantime, this little
hack will try to exploit the benefit of caching and fast'ish servers for all.
