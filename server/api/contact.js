'use strict';
const Config = require('../../config');
const Joi = require('joi');
const Mailer = require('../mailer');


const register = function (server, serverOptions) {

    server.route({
        method: 'POST',
        path: '/api/contact',
        options: {
            tags: ['api','contact'],
            auth: false,
            validate: {
                payload: {
                    name: Joi.string().required(),
                    email: Joi.string().email().required(),
                    message: Joi.string().required()
                }
            }
        },
        handler: async function (request, h) {

            const emailOptions = {
                subject: Config.get('/projectName') + ' contact form',
                to: Config.get('/system/toAddress'),
                replyTo: {
                    name: request.payload.name,
                    address: request.payload.email
                }
            };
            const template = 'contact';

            await Mailer.sendEmail(emailOptions, template, request.payload);

            return { message: 'Success.' };
        }
    });
};


module.exports = {
    name: 'api-contact',
    dependencies: [],
    register
};
