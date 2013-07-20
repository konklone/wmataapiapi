# Cost

## PUT

Reference: [s3 pricing](http://aws.amazon.com/s3/pricing/).

* A PUT costs $0.000005
* A GET costs $0.0000004
* There are 1440 minutes in a day

Putting a day's worth of minutes of bus locations costs 1440 * 0.000005,
or $0.0072. A year's worth of those puts is $2.628.

## LIST

LIST is relatively expensive at $0.000005. Thus right now we're caching
(via `/lib/dumbcache`) results each minute so that the cost doesn't exceed
2x PUT cost.

## STORAGE

Storage is $0.095 per GB. A typical bus API response is 72KB.

    72 * 1440 * 365 = 37843200
    37843200 KB = 36 GB
    36 GB * 0.095 = $3.42

So, after a year of running, this will likely cost around $3.42/month in storage
costs, and around $6 in total costs. This cost will increase linearly, so the
next year would cost around $10 a month, and then $13, and so on.

Ideally there's some way to reduce storage costs, either by gzip-compressing
responses or reducing the frequency of the historical record.
