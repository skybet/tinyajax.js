tinyajax.js
======

A tiny Ajax wrapper, with an err-back interface

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
