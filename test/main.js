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

    context('having made a get request', function() {
        var callback;

        beforeEach(function() {
            callback = sinon.spy();
            tinyajax.get('http://www.example.com', callback);
        });

        it('should have made an XHR request', function() {
            assert.equal(requests.length, 1);

            var request = requests[0];
            assert.equal(request.url, 'http://www.example.com');
        });

        context('after the server has responded', function() {
            beforeEach(function() {
                var request = requests[0];
                request.respond(200, {}, '<h1>success</h1>');
            });

            it('should have run the callback', function() {
                sinon.assert.calledOnce(callback);
            });
        });
    });

});
