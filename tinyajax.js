/*!
* tinyajax.js
* (c) 2014 Sky Bet, http://www.skybet.com
* https://github.com/skybet/tinyajax.js
* license MIT
*/
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.tinyAjax = factory();
    }
}(this, function () {
    var exports = {
        // Methods
        get:  curryAjax('GET'),
        post: curryAjax('POST'),
        put:  curryAjax('PUT'),
        del:  curryAjax('DELETE'),

        // Options
        timeoutDelay: false,

        // Errors
        NOXHR:      1,
        TIMEOUT:    2,
        JSONDECODE: 3
    };

    function ajax(method, url, data, headers, callback) {
        if (typeof data === 'function') {
            callback = data;
            headers = {};
            data = {};
        } else if (typeof headers === 'function') {
            callback = headers;
            headers = {};
        }

        data     = data || {};
        headers  = headers || {};
        callback = callback || function() {};

        var xhr = getXhr();
        if (!xhr) {
            var err = new Error('No XHR available');
            err.code = exports.NOXHR;
            return callback(err);
        }

        var payload = encode(data);
        if (method === 'GET' && payload) {
            if (payload) {
                url += '?' + payload;
            }
            payload = null;
        }

        xhr.open(method, url);

        if (!headers['Content-type']) {
            headers['Content-type'] = 'application/x-www-form-urlencoded';
        }

        for (var h in headers) {
            if (headers.hasOwnProperty(h)) {
                xhr.setRequestHeader(h, headers[h]);
            }
        }

        var timeoutId = exports.timeoutDelay && setTimeout(function() {
            xhr.abort();
            var err = new Error('XHR timed out');
            err.code = exports.TIMEOUT;
            return callback(err);
        }, exports.timeoutDelay);

        xhr.onreadystatechange = function() {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            if (xhr.readyState !== 4) {
                return;
            }

            var err = !xhr.status ||
                (xhr.status < 200 || xhr.status >= 300) &&
                xhr.status !== 304 &&
                // IE changes 204 to 1223: http://bugs.jquery.com/ticket/1450
                xhr.status !== 1223 &&
                new Error('HTTP Status error');
            err.status = xhr.status;

            var response = xhr.responseText;
            var contentType = xhr.getResponseHeader('Content-type');

            if (contentType && contentType.indexOf('json') !== -1) {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    var err = new Error('Could not decode JSON response: ' + e.toString());
                    err.code = exports.JSONDECODE;
                    return callback(err);
                }
            }

            return callback(err, response, xhr);
        };

        xhr.send(payload);
    }

    function curryAjax(method) {
        return function(url, data, headers, callback) {
            return ajax(method, url, data, headers, callback);
        };
    }

    function getXhr() {
        var xhr;
        if (window.XMLHttpRequest) {
            xhr = new window.XMLHttpRequest();
        } else if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) { }
        }
        return xhr;
    }

    function encode(data) {
        if ('string' === typeof data) {
            return data;
        }

        var dataParts = [];
        for (var k in data) {
            if (data.hasOwnProperty(k)) {
                dataParts.push(
                    encodeURIComponent(k) + '=' + encodeURIComponent(data[k])
                );
            }
        }
        return dataParts.join('&');
    }

    return exports;
}));
