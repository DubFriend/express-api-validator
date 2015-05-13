var bodyParser = require('body-parser');
var app = require('express')();
var requestValidator = require('../index.js')();
var request = require('request');
var _ = require('underscore');
var Q = require('q');

app.use(bodyParser.json());

var routeBasic = function (method, groupName) {
    var fig = {};
    fig[groupName] = {
        name: {
            validators: ['required', 'minimumLength:3']
        }
    };

    app[method]('/' + groupName, requestValidator(fig), function (req, res, next) {
        res.json({ success: true });
    });
};

routeBasic('post', 'body');
routeBasic('get', 'query');

var routeNested = function (method, groupName) {
    var fig = {};
    fig[groupName] = {
        object: {
            properties: {
                name: {
                    validators: ['required', 'minimumLength:3']
                }
            }
        }
    };

    app[method](
        '/nested-' + groupName,
        requestValidator(fig),
        function (req, res, next) {
            res.json({ success: true });
        }
    );
};

routeNested('post', 'body');
routeNested('get', 'query');

var createWrappedRequestMethod = function (method) {
    return function (url, fig) {
        fig = fig || {};
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

var testSuccessBasic = function (promise, test) {
    test.expect(2);
    promise.then(function (res) {
        test.strictEqual(res.statusCode, 200, 'status code is "200"');
        test.strictEqual(
            res.body.success, true,
            'success response body'
        );
        test.done();
    })
    .done();
};

var testSuccessNested = function (promise, test) {
    test.expect(2);
    promise.then(function (res) {
        test.strictEqual(res.statusCode, 200, 'status code is "200"');
        test.strictEqual(
            res.body.success, true,
            'success response body'
        );
        test.done();
    })
    .done();
};

var testFailureBasicDataInvalid = function (groupName, promise, test) {
    test.expect(2);
    var expectedErrors = {
        errors: {}
    };
    expectedErrors.errors[groupName] = {
        name: ['Name must be at least 3 characters long']
    };
    promise.then(function (res) {
        test.strictEqual(res.statusCode, 400, 'status code is "400"');
        test.deepEqual(
            res.body,
            expectedErrors,
            'response body contains errors'
        );
        test.done();
    })
    .done();
};

var testFailureNestedDataInvalid = function (groupName, promise, test) {
    test.expect(2);
    var expectedErrors = {
        errors: {}
    };
    expectedErrors.errors[groupName] = {
        object: {
            name: ['Name must be at least 3 characters long']
        }
    };

    promise.then(function (res) {
        test.strictEqual(res.statusCode, 400, 'status code is "400"');
        test.deepEqual(
            res.body,
            expectedErrors,
            'response body contains error messages'
        );
        test.done();
    })
    .done();
};

var testFailureBasicDataAbsent = function (groupName, promise, test) {
    test.expect(2);
    var expectedErrors = {
        errors: {}
    };
    expectedErrors.errors[groupName] = {
        name: [
            'Name is required',
            'Name must be at least 3 characters long'
        ]
    };
    promise.then(function (res) {
        test.strictEqual(res.statusCode, 400, 'status code is "400"');
        test.deepEqual(
            res.body,
            expectedErrors,
            'response body contains errors'
        );
        test.done();
    })
    .done();
};

var testFailureNestedDataAbsent = function (groupName, promise, test) {
    test.expect(2);
    var expectedErrors = {
        errors: {}
    };
    expectedErrors.errors[groupName] = {
        object: {
            name: [
                'Name is required',
                'Name must be at least 3 characters long'
            ]
        }
    };

    promise.then(function (res) {
        test.strictEqual(res.statusCode, 400, 'status code is "400"');
        test.deepEqual(
            res.body,
            expectedErrors,
            'response body contains error messages'
        );
        test.done();
    })
    .done();
};

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

    bodyBasicSuccess: _.partial(testSuccessBasic, post('/body', {
        body: { name: 'foo' }
    })),

    queryBasicSuccess: _.partial(testSuccessBasic, get('/query', {
        qs: { name: 'foo' }
    })),

    bodyBasicFailureValuesInvalid: _.partial(
        testFailureBasicDataInvalid,
        'body',
        post('/body', {
            body: { name: 'fo' }
        })
    ),

    queryBasicFailureValuesInvalid: _.partial(
        testFailureBasicDataInvalid,
        'query',
        get('/query', {
            qs: { name: 'fo' }
        })
    ),

    bodyBasicFailureValuesAbsent: _.partial(
        testFailureBasicDataAbsent,
        'body',
        post('/body', {})
    ),

    queryBasicFailureValuesAbsent: _.partial(
        testFailureBasicDataAbsent,
        'query',
        get('/query', {})
    ),

    bodyNestedSuccess: _.partial(testSuccessNested, post('/nested-body', {
        body: { object: { name: 'foo' } }
    })),

    queryNestedSuccess: _.partial(testSuccessNested, get('/nested-query', {
        qs: { object: { name: 'foo' } }
    })),

    bodyNestedFailureValuesInvalid: _.partial(
        testFailureNestedDataInvalid,
        'body',
        post('/nested-body', {
            body: { object: { name: 'fo' } }
        })
    ),

    queryNestedFailureValuesInvalid: _.partial(
        testFailureNestedDataInvalid,
        'query',
        get('/nested-query', {
            qs: { object: { name: 'fo' } }
        })
    ),

    bodyNestedFailureValuesAbsent: _.partial(
        testFailureNestedDataAbsent,
        'body',
        post('/nested-body', {})
    ),

    queryNestedFailureValuesAbsent: _.partial(
        testFailureNestedDataAbsent,
        'query',
        get('/nested-query', {})
    )
};