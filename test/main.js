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

    context('make XHR request', function() {

        context('with url and callback', function() {
            var callback;

            beforeEach(function() {
                callback = sinon.spy();
                tinyajax.get('http://www.example.com', callback);
            });

            it('should make an XHR GET request to the URL', function() {
                assert.equal(requests.length, 1);

                var request = requests[0];
                assert.equal(request.url, 'http://www.example.com');
            });

            context('after server responds successfully', function() {
                beforeEach(function() {
                    var request = requests[0];
                    request.respond(200, {}, '<h1>success</h1>');
                });

                it('should run the callback with no error and the response', function() {
                    sinon.assert.calledOnce(callback);
                    sinon.assert.calledWith(callback, null, '<h1>success</h1>');
                });
            });

            context('after server responds unsuccessfully', function() {
                var error;

                beforeEach(function() {
                    var request = requests[0];
                    request.respond(500, {}, '<h1>server error</h1>');
                    error = callback.lastCall.args[0];
                });

                it('should run the callback with an error', function() {
                    sinon.assert.calledOnce(callback);
                    assert.ok(error);
                });

                context('the error', function() {
                    it('should contain the HTTP status code on error.code', function() {
                        assert.equal(error.status, 500);
                    });
                    it('should contain the XHR object on error.xhr', function() {
                        assert.ok(error.xhr);
                    });
                });
            });

            context('after server fails to respond', function() {
                it('should not run the callback', function() {
                    sinon.assert.notCalled(callback);
                });
            });

            context('when server responds successfully with JSON', function() {
                beforeEach(function() {
                    var request = requests[0];
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

                    var response = callback.lastCall.args[1];
                    sinon.assert.calledWith(callback, null, {
                        success: true
                    });
                });
            });

            context('when server responds unsuccessfully with JSON', function() {
                var error;

                beforeEach(function() {
                    var request = requests[0];
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

                it.skip('should return the decoded JSON on error.response', function() {
                    assert.ok(error);
                    assert.deepEqual(error.response, {
                        success: false
                    });
                });
            });

            context('when server responds with invalid JSON', function() {
                beforeEach(function() {
                    var request = requests[0];
                    var headers = {
                        'Content-Type': 'application/json'
                    }
                    request.respond(400, headers, '{ not valid: json, oh nos } <h1>error</h1>');
                });

                it('should return a JSON decode error', function() {
                    sinon.assert.calledOnce(callback);

                    var errorArg = callback.lastCall.args[0];

                    assert.equal(errorArg.code, tinyajax.JSONDECODE);
                });
            });

        });

        context('with url, headers and callback', function() {
            beforeEach(function() {
                var headers = {
                    Accept: 'application/json'
                }

                tinyajax.get('http://www.example.com', null, headers);
            });

            it('should correctly send the headers', function() {
                var request = requests[0];
                assert.equal(request.requestHeaders.Accept, 'application/json');
            });
        });
    });

    describe('make XHR request with data', function() {
        var data = {
            foo: true,
            bar: 'test',
            baz: 123
        };

        context('get()', function() {
            beforeEach(function() {
                tinyajax.get('http://www.example.com', data);
            });

            it('should serialise the data into the URL query parameters', function() {
                var request = requests[0];
                assert.equal(request.url, 'http://www.example.com?foo=true&bar=test&baz=123');
            });

            it.skip('should specificy form-encoding as the content-type', function() {
                var request = requests[0];
                assert.equal(request.requestHeaders['Content-Type'], 'application/x-www-form-urlencoded');
            });
        });

        context('post()', function() {
            beforeEach(function() {
                tinyajax.post('http://www.example.com', data);
            });

            it('should send form-encoded data in the POST body', function() {
                var request = requests[0];
                assert.equal(request.requestBody, 'foo=true&bar=test&baz=123');
            });

            it.skip('should specificy form-encoding as the content-type', function() {
                var request = requests[0];
                assert.equal(request.requestHeaders['Content-Type'], 'application/x-www-form-urlencoded');
            });

        });
    });

    describe('make XHR request with data and headers', function() {
        var callback;
        var data = {
            foo: true,
            bar: 'test',
            baz: 123
        };
        var headers = {
            'Accept': 'application/json'
        };

        context('get()', function() {
            beforeEach(function() {
                callback = sinon.spy();
                tinyajax.get('http://www.example.com', data, headers, callback);
            });

            it('should serialise the data into the URL query parameters', function() {
                var request = requests[0];
                assert.equal(request.url, 'http://www.example.com?foo=true&bar=test&baz=123');
            });
            it('should send the specified headers', function() {
                var request = requests[0];
                assert.equal(request.requestHeaders.Accept, 'application/json');
            });
        });
        context('post()', function() {
            beforeEach(function() {
                callback = sinon.spy();
                tinyajax.post('http://www.example.com', data, headers, callback);
            });

            it('should send form-encoded data in the POST body', function() {
                var request = requests[0];
                assert.equal(request.requestBody, 'foo=true&bar=test&baz=123');
            });

            it('should send the specified headers', function() {
                var request = requests[0];
                assert.equal(request.requestHeaders.Accept, 'application/json');
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

        context('after server fails to respond within timeout limit', function() {
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

    describe('handle response HTTP status codes', function() {
        var callbacks = {};
        var errors = {};

        function iterateStatusCodes(type, callback) {
            var start;
            var stop;

            if (type === 'success') {
                start = 200;
                stop  = 299;
            } else if (type === 'client-error') {
                start = 400;
                stop  = 499;
            } else {
                throw new Error('Not implemented');
            }

            for (var i = 0, code = start; code <= stop; i++, code++) {
                callback(code, i);
            }
        };

        context('when it receives an HTTP success code', function() {
            beforeEach(function() {
                iterateStatusCodes('success', function(code, i) {
                    var callback = sinon.spy();
                    callbacks[code] = callback;
                    tinyajax.get('http://www.example.com', callback);

                    var request = requests[i];
                    request.respond(code, {}, '<h1>success</h1>');
                });
            });

            it('should not return an error', function() {
                iterateStatusCodes('success', function(code) {
                    var callback = callbacks[code];
                    sinon.assert.calledOnce(callback);
                    sinon.assert.calledWith(callback, null);
                });
            });
        });

        context('when it receives an HTTP client error', function() {
            beforeEach(function() {
                iterateStatusCodes('client-error', function(code, i) {
                    var callback = sinon.spy();
                    callbacks[code] = callback;
                    tinyajax.get('http://www.example.com', callback);

                    var request = requests[i];
                    request.respond(code, {}, '<h1>failure</h1>');

                    errors[code] = callback.lastCall.args[0];
                });
            });

            it('should return an error', function() {
                iterateStatusCodes('client-error', function(code) {
                    var callback = callbacks[code];
                    sinon.assert.calledOnce(callback);
                    assert.ok(errors[code]);
                });
            });
        });
    });

});
