tinyajax.js
======

A tiny Ajax wrapper, with an err-back interface

[![Build Status](https://travis-ci.org/skybet/tinyajax.js.svg?branch=master)](https://travis-ci.org/skybet/tinyajax.js)

## Examples
```js
tinyAjax.get(
    '/path',
    {
        data: 'test'
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
