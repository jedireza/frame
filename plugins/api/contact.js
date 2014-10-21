var Joi = require('joi');
var Hoek = require('hoek');
var config = require('../../config');


exports.register = function (plugin, options, next) {

    options = Hoek.applyToDefaults({ basePath: '' }, options);


    plugin.route({
        method: 'POST',
        path: options.basePath + '/contact',
        config: {
            validate: {
                payload: {
                    name: Joi.string().required(),
                    email: Joi.string().email().required(),
                    message: Joi.string().required()
                }
            }
        },
        handler: function (request, reply) {

            var mailer = request.server.plugins.mailer;
            var options = {
                subject: config.get('/projectName') + ' contact form',
                to: config.get('/system/toAddress'),
                replyTo: {
                    name: request.payload.name,
                    address: request.payload.email
                }
            };
            var template = 'contact';

            mailer.sendEmail(options, template, request.payload, function (err, info) {

                if (err) {
                    return reply(err);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register.attributes = {
    name: 'contact'
};
