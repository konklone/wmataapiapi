# [wmata apiapi](http://secret-wildwood-1777.herokuapp.com/)

http://secret-wildwood-1777.herokuapp.com/

```
/rail/station/
/rail/station/:code
/rail/station/:code/prediction
/rail/station/all/prediction
```

It's an API on an API on an API.

Here's how it works:

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
