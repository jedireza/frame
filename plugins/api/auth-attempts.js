var Joi = require('joi');
var authPlugin = require('../auth');


exports.register = function (plugin, options, next) {

    plugin.route({
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
                    sort: Joi.string(),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            },
            pre: [
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AuthAttempt = request.server.plugins.models.AuthAttempt;
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


    plugin.route({
        method: 'GET',
        path: '/auth-attempts/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            pre: [
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AuthAttempt = request.server.plugins.models.AuthAttempt;

            AuthAttempt.findById(request.params.id, function (err, authAttempt) {

                if (err) {
                    return reply(err);
                }

                if (!authAttempt) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply(authAttempt);
            });
        }
    });


    plugin.route({
        method: 'DELETE',
        path: '/auth-attempts/{id}',
        config: {
            auth: {
                strategy: 'simple',
                scope: 'admin'
            },
            pre: [
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var AuthAttempt = request.server.plugins.models.AuthAttempt;

            AuthAttempt.findByIdAndRemove(request.params.id, function (err, count) {

                if (err) {
                    return reply(err);
                }

                if (count === 0) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register.attributes = {
    name: 'auth-attempts'
};
