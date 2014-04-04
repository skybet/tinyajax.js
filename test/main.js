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

            it('should make an XHR request to the URL', function() {
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
                it('should run the callback with an error');
            });

            context('after server fails to respond', function() {
                it('should run the callback with a timeout error');
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
            it('should correctly send the headers');
        });

    });

});
