var bodyParser = require('body-parser');
var app = require('express')();
var requestValidator = require('../index.js')();
var request = require('request');
var _ = require('underscore');
var Q = require('q');

app.use(bodyParser.json());

app.post('/basic', requestValidator({
        body: {
            name: {
                validators: ['required', 'minimumLength:3']
            }
        }
    }),
    function (req, res, next) {
        res.json({ success: true });
    }
);

app.post(
    '/nested-body',
    requestValidator({
        body: {
            object: {
                properties: {
                    name: {
                        validators: ['required', 'minimumLength:3']
                    }
                }
            }
        }
    }),
    function (req, res, next) {
        res.json({ success: true })
    }
);

var createWrappedRequestMethod = function (method) {
    return function (url, fig) {
        return Q.Promise(function (resolve, reject, notify) {
            request[method](
                _.extend({
                    url: 'http://localhost:3000' + url,
                    json: true
                }, fig),
                function (err, response, body) {
                    if(err) {
                        reject(err);
                    }
                    else {
                        resolve(response);
                    }
                }
            );
        });
    };
};

var get = createWrappedRequestMethod('get');
var put = createWrappedRequestMethod('put');
var post = createWrappedRequestMethod('post');
var del = createWrappedRequestMethod('del');

var isConnected = false;
module.exports = {

    setUp: function (done) {
        if(!isConnected) {
            app.listen(3000, function () {
                isConnected = true;
                done();
            });
        }
        else {
            done();
        }
    },

    postSuccess: function (test) {
        test.expect(2);
        post('/basic', {
            body: {
                name: 'foo'
            }
        })
        .then(function (res) {
            test.strictEqual(res.statusCode, 200, 'status code is "200"');
            test.strictEqual(
                res.body.success, true,
                'success response body'
            );
            test.done();
        })
        .done();
    },

    postValidatorsFailureBodyParameterInvalid: function (test) {
        test.expect(2);
        post('/basic', {
            body: {
                name: 'fo'
            }
        })
        .then(function (res) {
            test.strictEqual(res.statusCode, 400, 'status code is "400"');
            test.deepEqual(
                res.body,
                { errors: {
                    body: {
                        name: ['Name must be at least 3 characters long']
                    }
                } },
                'response body contains errors'
            );
            test.done();
        })
        .done();
    },

    postValidatorsFailureBodyParameterAbsent: function (test) {
        test.expect(2);
        post('/basic', {})
        .then(function (res) {
            test.strictEqual(res.statusCode, 400, 'status code is "400"');
            test.deepEqual(
                res.body,
                { errors: {
                    body: {
                        name: [
                            'Name is required',
                            'Name must be at least 3 characters long'
                        ]
                    }
                } },
                'response body contains errors'
            );
            test.done();
        })
        .done();
    },

    postNestedValidatorsSuccess: function (test) {
        test.expect(2);
        post('/nested-body', {
            body: {
                object: {
                    name: 'foo'
                }
            }
        })
        .then(function (res) {
            test.strictEqual(res.statusCode, 200, 'status code is "200"');
            test.strictEqual(
                res.body.success, true,
                'success response body'
            );
            test.done();
        })
        .done();
    },

    postNestedValidatorsFailure: function (test) {
        test.expect(2);
        post('/nested-body', {
            body: {
                object: {
                    name: 'fo'
                }
            }
        })
        .then(function (res) {
            test.strictEqual(res.statusCode, 400, 'status code is "400"');
            test.deepEqual(
                res.body,
                { errors: {
                    body: { object: {
                            name: [
                                'Name must be at least 3 characters long'
                            ]
                        }
                    }
                } },
                'response body contains error messages'
            );
            test.done();
        })
        .done();
    },

    postNestedValidatorsBodyAbsent: function (test) {
        test.expect(2);
        post('/nested-body', {
        })
        .then(function (res) {
            test.strictEqual(res.statusCode, 400, 'status code is "400"');
            test.deepEqual(
                res.body,
                { errors: {
                    body: { object: {
                            name: [
                                'Name is required',
                                'Name must be at least 3 characters long'
                            ]
                        }
                    }
                } },
                'response body contains error messages'
            );
            test.done();
        })
        .done();
    }
}