var Boom = require('boom');
var Joi = require('joi');
var AuthPlugin = require('../auth');


var internals = {};


internals.applyRoutes = function (server, next) {

    var AuthAttempt = server.plugins['hapi-mongo-models'].AuthAttempt;


    server.route({
        method: 'GET',
        path: '/auth-attempts',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            validate: {
                query: {
                    fields: Joi.string(),
                    sort: Joi.string().default('_id'),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var query = {};
            var fields = request.query.fields;
            var sort = request.query.sort;
            var limit = request.query.limit;
            var page = request.query.page;

            AuthAttempt.pagedFind(query, fields, sort, limit, page, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/auth-attempts/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            AuthAttempt.findById(request.params.id, function (err, authAttempt) {

                if (err) {
                    return reply(err);
                }

                if (!authAttempt) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(authAttempt);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/auth-attempts/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            pre: [
                AuthPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            AuthAttempt.findByIdAndDelete(request.params.id, function (err, authAttempt) {

                if (err) {
                    return reply(err);
                }

                if (!authAttempt) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register = function (server, options, next) {

    server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

    next();
};


exports.register.attributes = {
    name: 'auth-attempts'
};
