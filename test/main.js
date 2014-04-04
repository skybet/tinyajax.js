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

    beforeEach(function() {
        xhr = sinon.useFakeXMLHttpRequest();
        xhr.onCreate = function(req) {
            requests.push(req);
        }
        global.window = {
            XMLHttpRequest: xhr
        };
    });

    afterEach(function() {
        xhr.restore();
        requests = [];
    });

    context('get()', function() {

        context('with url, callback', function() {
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

                it.skip('should run the callback with no error and the response', function() {
                    sinon.assert.calledOnce(callback);
                    sinon.assert.calledWith(null, '<h1>success</h1>');
                });
            });

            context('after server responds unsuccessfully', function() {
                beforeEach(function() {
                    var request = requests[0];
                    request.respond(500, {}, '<h1>server error</h1>');
                });

                it('should run the callback with an error', function() {
                    sinon.assert.calledOnce(callback);
                    var errorArg = callback.lastCall.args[0];
                    assert.ok(errorArg);
                });
            });

            context('after server fails to respond', function() {
                context('and the timeout delay is not set', function() {
                    it('should not run the callback', function() {
                        sinon.assert.notCalled(callback);
                    });
                });
                context('and the timeout delay is set', function() {
                    it('should run the callback with a timeout error');
                });
            });

            context('when server responds successfully with JSON', function() {
                beforeEach(function() {
                    var request = requests[0];
                    var headers = {
                        'Content-Type': 'application/json'
                    }
                    request.respond(200, headers, JSON.stringify({
                        success: true
                    }));
                });

                it.skip('should return the decoded the JSON', function() {
                    sinon.assert.calledOnce(callback);

                    var response = callback.lastCall.args[1];
                    sinon.assert.calledWith(callback, null, {
                        success: true
                    });
                });
            });

            context('when server responds unsuccessfully with JSON', function() {
                beforeEach(function() {
                    var request = requests[0];
                    var headers = {
                        'Content-Type': 'application/json'
                    }
                    request.respond(400, headers, JSON.stringify({
                        success: false
                    }));
                });

                it.skip('should return the decoded the JSON', function() {
                    sinon.assert.calledOnce(callback);

                    var errorArg = callback.lastCall.args[0];

                    assert.deepEqual(errorArg.response, {
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

        context('with url, data, callback', function() {
            beforeEach(function() {
                var data = {
                    foo: true,
                    bar: 'test',
                    baz: 123
                };

                tinyajax.get('http://www.example.com', data);
            });

            it('should have encoded the data and appended to the URL', function() {
                var request = requests[0];
                assert.equal(request.url, 'http://www.example.com?foo=true&bar=test&baz=123');
            });

            it.skip('should have specified form encoding', function() {
                var request = requests[0];
                assert.equal(request.requestHeaders['Content-Type'], 'application/x-www-form-urlencoded');
            });
        });

        context('with url, data, headers, callback', function() {
            beforeEach(function() {
                var data = {
                    foo: true
                };
                var headers = {
                    Accept: 'application/json'
                }

                tinyajax.get('http://www.example.com', data, headers);
            });

            it('should have encoded the data and appended to the URL', function() {
                var request = requests[0];
                assert.equal(request.requestHeaders.Accept, 'application/json');
            });
        });

        context('with url, null, headers, callback', function() {
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

});
