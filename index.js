var _ = require('underscore');
var theValidator = require('the_validator');

module.exports = function (fig) {
	fig = fig || {};

	var validateGroup = function (properties, data) {
		data = data || {};
		var errors = {};

		_.each(properties, function (property, name) {
			var err = {};

			if(property.properties) {
				err = validateGroup(property.properties, data[name]);
				if(!_.isEmpty(err)) {
					errors[name] = err;
				}
			}
			else if(property.validators) {
				var validationSchema = {};
				validationSchema[name] = property.validators;

				var testValue = {};
				testValue[name] = data[name];

				err = theValidator(validationSchema)
					.test(testValue);

				if(err[name]) {
					errors[name] = err[name];
				}
			}
		});

		return errors;
	};

	var validate = function (schema, req) {
		var errors = {};

		var bodyErrors = validateGroup(schema.body, req.body);
		var queryErrors = validateGroup(schema.query, req.query);
		var paramsErrors = validateGroup(schema.params, req.params);

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