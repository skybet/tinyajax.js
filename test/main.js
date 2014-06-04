var assert = require('assert');
var mocha = require('mocha');
var tinyajax = require('../tinyajax').tinyAjax;

var xmlHttpRequest = global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest

var sinon = global.sinon = require('sinon');
require("sinon/lib/sinon/util/event");
require("sinon/lib/sinon/util/fake_xml_http_request");

describe('tinyajax.js', function() {

    var xhr;
    var requests = [];
    var clock;

    beforeEach(function() {
        // Set up fake XHR
        xhr = sinon.useFakeXMLHttpRequest();
        xhr.onCreate = function(req) {
            requests.push(req);
        }
        global.window = {
            XMLHttpRequest: xhr
        };

        // Set up fake timers
        clock = sinon.useFakeTimers();
    });

    afterEach(function() {
        xhr.restore();
        requests = [];
        clock.restore();
    });

    describe('make XHR request', function() {

        describe('with url and callback', function() {
            var callback;
            var request;

            beforeEach(function() {
                callback = sinon.spy();
                tinyajax.get('http://www.example.com', callback);
                request = requests[0];
            });

            it('should make an XHR GET request to the URL', function() {
                assert.equal(requests.length, 1);
                assert.equal(request.url, 'http://www.example.com');
            });

            describe('after server responds successfully', function() {
                beforeEach(function() {
                    request.respond(200, {}, '<h1>success</h1>');
                });

                it('should run the callback with no error and the response', function() {
                    sinon.assert.calledOnce(callback);
                    sinon.assert.calledWith(callback, null, '<h1>success</h1>');
                });
            });

            describe('after server responds unsuccessfully', function() {
                var error;

                beforeEach(function() {
                    request.respond(500, {}, '<h1>server error</h1>');
                    error = callback.lastCall.args[0];
                });

                it('should run the callback with an error', function() {
                    sinon.assert.calledOnce(callback);
                    assert.ok(error);
                });

                describe('the error', function() {
                    it('should contain the HTTP status code on error.code', function() {
                        assert.equal(error.status, 500);
                    });
                    it('should contain the XHR object on error.xhr', function() {
                        assert.ok(error.xhr);
                    });
                });
            });

            describe('after server fails to respond', function() {
                it('should not run the callback', function() {
                    sinon.assert.notCalled(callback);
                });
            });

            describe('when server responds successfully with JSON', function() {
                beforeEach(function() {
                    var headers = {
                        'Content-Type': 'application/json'
                    };
                    var data = JSON.stringify({
                        success: true
                    });
                    request.respond(200, headers, data);
                });

                it('should return the decoded JSON', function() {
                    sinon.assert.calledOnce(callback);

                    sinon.assert.calledWith(callback, null, {
                        success: true
                    });
                });
            });

            describe('when server responds unsuccessfully with JSON', function() {
                var error;

                beforeEach(function() {
                    var headers = {
                        'Content-Type': 'application/json'
                    }
                    request.respond(400, headers, JSON.stringify({
                        success: false
                    }));
                    error = callback.lastCall.args[0];
                });

                it('should run the callback', function() {
                    sinon.assert.calledOnce(callback);
                });

                it('should return the decoded JSON on error.response', function() {
                    assert.ok(error);
                    assert.deepEqual(error.response, {
                        success: false
                    });
                });
            });

            describe('when server responds with invalid JSON', function() {
                var error;

                beforeEach(function() {
                    var headers = {
                        'Content-Type': 'application/json'
                    }
                    request.respond(400, headers, '{ not valid: json, oh nos } <h1>error</h1>');

                    error = callback.lastCall.args[0];
                });

                it('should return a JSON decode error', function() {
                    sinon.assert.calledOnce(callback);
                    assert.equal(error.code, tinyajax.JSONDECODE);
                });

                it('should contain the XHR object on error.xhr', function() {
                    assert.ok(error.xhr);
                });
            });

        });

        describe('with url, headers and callback', function() {
            var request;

            beforeEach(function() {
                var headers = {
                    Accept: 'application/json'
                }

                tinyajax.get('http://www.example.com', null, headers);
                request = requests[0];
            });

            it('should correctly send the headers', function() {
                assert.equal(request.requestHeaders.Accept, 'application/json');
            });
        });
    });

    describe('make XHR request with data', function() {
        var request;
        var data = {
            foo: true,
            bar: 'test',
            baz: 123
        };

        describe('get()', function() {
            beforeEach(function() {
                tinyajax.get('http://www.example.com', data);
                request = requests[0];
            });

            it('should serialise the data into the URL query parameters', function() {
                assert.equal(request.url, 'http://www.example.com?foo=true&bar=test&baz=123');
            });

            it('should specificy form-encoding as the content-type', function() {
                var contentTypeHeader = request.requestHeaders['Content-Type'];
                assert.equal(contentTypeHeader, 'application/x-www-form-urlencoded');
            });
        });

        describe('post()', function() {
            beforeEach(function() {
                tinyajax.post('http://www.example.com', data);
                request = requests[0];
            });

            it('should make an XHR POST request to the URL', function() {
                assert.equal(request.url, 'http://www.example.com');
            });

            it('should send form-encoded data in the POST body', function() {
                assert.equal(request.requestBody, 'foo=true&bar=test&baz=123');
            });

            it('should specificy form-encoding as the content-type', function() {
                var contentTypeHeader = request.requestHeaders['Content-Type'];

                // Character encoding is sent as well so split the string
                var parts = contentTypeHeader.split(';');
                assert.equal(parts[0], 'application/x-www-form-urlencoded');
            });

        });
    });

    describe('make XHR request with data and headers', function() {
        var callback;
        var request;
        var data = {
            foo: true,
            bar: 'test',
            baz: 123
        };
        var headers = {
            'Accept': 'application/json'
        };

        describe('get()', function() {
            beforeEach(function() {
                callback = sinon.spy();
                tinyajax.get('http://www.example.com', data, headers, callback);
                request = requests[0];
            });

            it('should serialise the data into the URL query parameters', function() {
                assert.equal(request.url, 'http://www.example.com?foo=true&bar=test&baz=123');
            });
            it('should send the specified headers', function() {
                assert.equal(request.requestHeaders.Accept, 'application/json');
            });
        });
        describe('post()', function() {
            beforeEach(function() {
                callback = sinon.spy();
                tinyajax.post('http://www.example.com', data, headers, callback);
                request = requests[0];
            });

            it('should send form-encoded data in the POST body', function() {
                assert.equal(request.requestBody, 'foo=true&bar=test&baz=123');
            });

            it('should send the specified headers', function() {
                assert.equal(request.requestHeaders.Accept, 'application/json');
            });
        });
    });

    describe('make XHR request with data and JSON header', function() {
        var data = {
            foo: true,
            bar: 'test',
            baz: 123
        };
        var headers = {
            'Content-Type': 'application/json'
        };
        var request;

        describe('post()', function() {
            beforeEach(function() {
                tinyajax.post('http://www.example.com', data, headers);
                request = requests[0];
            });

            it('should send JSON-encoded data in the POST body', function() {
                assert.equal(request.requestBody, '{"foo":true,"bar":"test","baz":123}');
            });

            it('should send the specified headers', function() {
                var contentTypeHeader = request.requestHeaders['Content-Type'];

                // Character encoding is sent as well so split the string
                var parts = contentTypeHeader.split(';');
                assert.equal(parts[0], 'application/json');
            });
        });
    });

    describe('make XHR request with timeout', function() {
        var callback;

        beforeEach(function() {
            callback = sinon.spy();
            tinyajax.timeoutDelay = 1000;
            tinyajax.get('http://www.example.com', callback);
        });

        describe('after server fails to respond within timeout limit', function() {
            var error;

            beforeEach(function() {
                clock.tick(1000);
                error = callback.lastCall.args[0];
            });

            it('should run the callback', function() {
                sinon.assert.called(callback);
            });

            it('should return a timeout error on error.code', function() {
                assert.ok(error);
                assert.equal(error.code, tinyajax.TIMEOUT);
            });
        });
    });

    describe('make XHR request when no XHR object is available', function() {
        var callback;
        var error;

        beforeEach(function() {
            global.window = {
                XMLHttpRequest: undefined
            };

            callback = sinon.spy();
            tinyajax.get('http://www.example.com', callback);
            error = callback.lastCall.args[0];
        });

        it('should run the callback', function() {
            sinon.assert.calledOnce(callback);
        });

        it('should return a no XHR error on error.code', function() {
            assert.ok(error);
            assert.equal(error.code, tinyajax.NOXHR);
        });
    });

    describe('make XHR request to URL with query parameters', function() {
        var data = {
            bar: 'test',
            baz: 123
        };
        var request;

        describe('with data', function() {
            beforeEach(function() {
                tinyajax.get('http://www.example.com?foo=foo', data);
                request = requests[0];
            });

            it('should serialise new data on to the URL correctly', function() {
                assert.equal(request.url, 'http://www.example.com?foo=foo&bar=test&baz=123');
            });
        });
    });

    describe('handle response HTTP status codes', function() {
        function createRange() {
            var list = [];

            for (var i in arguments) {
                var parts = arguments[i].split('-');

                if (parts.length === 2) {
                    var start = parseInt(parts[0], 10);
                    var stop = parseInt(parts[1], 10);

                    for (var i = start; i <= stop; i++) {
                        list.push(i);
                    }
                } else {
                    list.push(parseInt(parts, 10));
                }
            }

            return list;
        }

        var successCodes = createRange(
            '200-208',
            '226'
        );
        var errorCodes = createRange(
            // Client error
            '400-420',
            '422-426',
            '428-429',
            '431',
            '440',
            '444',
            '449-451',
            '494-497',
            '499',

            // Server error
            '500-511',
            '520-524',
            '598-599'
        );

        successCodes.forEach(function(httpCode) {
            describe('when it makes an XHR call and receives HTTP status code ' + httpCode, function() {
                var callback = sinon.spy();

                beforeEach(function() {
                    tinyajax.get('http://www.example.com', callback);

                    var request = requests[0];
                    request.respond(httpCode, {}, '<h1>success</h1>');
                });

                it('should not return an error', function() {
                    sinon.assert.calledOnce(callback);
                    sinon.assert.calledWith(callback, null);
                });
            });
        });

        errorCodes.forEach(function(httpCode) {
            describe('when it makes an XHR call and receives HTTP status code ' + httpCode, function() {
                var callback = sinon.spy();

                beforeEach(function() {
                    tinyajax.get('http://www.example.com', callback);

                    var request = requests[0];
                    request.respond(httpCode, {}, '<h1>success</h1>');
                });

                it('should return an error with the code', function() {
                    sinon.assert.calledOnce(callback);

                    var errorObject = callback.lastCall.args[0];
                    assert.ok(errorObject);
                    assert.equal(errorObject.status, httpCode);
                });
            });
        });
    });

});
