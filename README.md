tinyajax.js
======

A tiny Ajax wrapper, with an err-back interface, JSON decoding and AMD support.

[![Build Status](https://travis-ci.org/skybet/tinyajax.js.svg?branch=master)](https://travis-ci.org/skybet/tinyajax.js)

## Examples
```js
tinyAjax.get(
    '/path',
    {
        foo: 'bar'
    },
    {
        Accept: 'application/json'
    },
    function(err, response) {
        if (err) {
            // oh no
        }
        // do stuff
    }
);
```
