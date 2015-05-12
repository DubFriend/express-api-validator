var _ = require('underscore');
var theValidator = require('the_validator');

// var mapObject = function (o, callback) {
// 	var mapped = {};
// 	_.each(o, function (val, key) {
// 		mapped[key] = callback(val, key, o);
// 	});
// 	return mapped;
// };

module.exports = function (fig) {
	fig = fig || {};

	var validateBody = function (properties, body) {
		body = body || {};
		var errors = {};

		_.each(properties, function (property, name) {
			var err = {};

			if(property.properties) {
				err = validateBody(property.properties, body[name]);
				if(!_.isEmpty(err)) {
					errors[name] = err;
				}
			}
			else if(property.validators) {
				var validationSchema = {};
				validationSchema[name] = property.validators;

				var testValue = {};
				testValue[name] = body[name];

				err = theValidator(validationSchema)
					.test(testValue);

				if(err[name]) {
					errors[name] = err[name];
				}
			}

			return err;
		});

		return errors;
	};

	var validateParams = function (properties, params) {

	};

	var validateQuery = function (properties, query) {

	};

	var validate = function (schema, req) {
		var errors = {};
		var bodyErrors = validateBody(schema.body, req.body);
		var paramsErrors = validateParams(schema.params, req.params);
		var queryErrors = validateParams(schema.query, req.query);

		if(!_.isEmpty(bodyErrors)) {
			errors.body = bodyErrors;
		}

		if(!_.isEmpty(paramsErrors)) {
			errors.params = paramsErrors;
		}

		if(!_.isEmpty(queryErrors)) {
			errors.query = queryErrors;
		}

		return errors;
	};

	return function connectRequestValidator (schema) {
		return function (req, res, next) {
			var errors = validate(schema, req);

			if(_.isEmpty(errors)) {
				next();
			}
			else {
				res.status(400).json({ errors: errors });
			}
		};
	};
};