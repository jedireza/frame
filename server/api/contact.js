var Joi = require('joi');
var Hoek = require('hoek');
var Config = require('../../config');


var internals = {};


internals.applyRoutes = function (server, next) {

    server.route({
        method: 'POST',
        path: '/contact',
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
            var emailOptions = {
                subject: Config.get('/projectName') + ' contact form',
                to: Config.get('/system/toAddress'),
                replyTo: {
                    name: request.payload.name,
                    address: request.payload.email
                }
            };
            var template = 'contact';

            mailer.sendEmail(emailOptions, template, request.payload, function (err, info) {

                if (err) {
                    return reply(err);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register = function (server, options, next) {

    server.dependency('mailer', internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'contact'
};
