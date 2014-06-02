tinyajax.js
======

A tiny Ajax wrapper, with an err-back interface, JSON decoding and AMD support.

[![Build Status](https://travis-ci.org/skybet/tinyajax.js.svg?branch=master)](https://travis-ci.org/skybet/tinyajax.js)

## Why

We wanted an Ajax library that had the following features:
* err-back interface, because this is a nicer way to handle errors and has become the de-facto pattern when dealing with asynchronous functions.
* full support for JSON-decoding of responses, even if the HTTP status code was not in the success range. Our web applications can return an error page, for example a 404, with a valid JSON response that describes how to display the error. Other libraries have chosen not to attempt to decode these responses even when the server has said explicitly via the Content-Type header field, which is not helpful for our use case.
* very small code footprint so that we keep things fast for mobile devices.

## Examples

### GET call with data, request header fields and callback
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
            // Handle basic errors
            if (err === tinyAjax.NOXHR) {
                // the browser does not support XHR
            } else if (err === tinyAjax.TIMEOUT) {
                // the request timed-out
            } else if (err === tinyAjax.JSONDECODE) {
                // the response said it was JSON, but it could not be decoded
            }

            // Get access to the specific error data
            var statusCode = err.code;
            var xhrObject = err.xhr;

            return;
        }

        // success
    }
);
```
### Minimal fire-and-forget POST call
```js
tinyAjax.post('/path');
```

### Set a custom timeout, then make a call
```js
// Set request timeout to 10000 milliseconds
tinyAjax.timeoutDelay = 10000
tinyAjax.get('/path', function(err, response) {
    // do stuff
});
```
