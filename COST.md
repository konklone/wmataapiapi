# Cost

Reference: [s3 pricing](http://aws.amazon.com/s3/pricing/).

* A PUT costs $0.000005
* A GET costs $0.0000004
* There are 1440 minutes in a day

Putting a day's worth of minutes of bus locations costs 1440 * 0.000005,
or $0.0072. A year's worth of those puts is $2.628.

* Transfer in is free

LIST is relatively expensive at $0.000005. Thus right now we're caching
(via `/lib/dumbcache`) results each minute so that the cost doesn't exceed
2x PUT cost.
