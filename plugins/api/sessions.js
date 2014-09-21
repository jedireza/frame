var Joi = require('joi');
var authPlugin = require('../auth');


exports.register = function (plugin, options, next) {

    plugin.route({
        method: 'GET',
        path: '/sessions',
        config: {
            auth: 'simple',
            validate: {
                query: {
                    fields: Joi.string(),
                    sort: Joi.string(),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            },
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Session = request.server.plugins.models.Session;
            var query = {};
            var fields = request.query.fields;
            var sort = request.query.sort;
            var limit = request.query.limit;
            var page = request.query.page;

            Session.pagedFind(query, fields, sort, limit, page, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    plugin.route({
        method: 'GET',
        path: '/sessions/{id}',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Session = request.server.plugins.models.Session;

            Session.findById(request.params.id, function (err, session) {

                if (err) {
                    return reply(err);
                }

                if (!session) {
                    return reply({ message: 'Document not found.' }).code(404);
                }

                reply(session);
            });
        }
    });


    plugin.route({
        method: 'DELETE',
        path: '/sessions/{id}',
        config: {
            auth: 'simple',
            pre: [
                authPlugin.preware.ensureUserRole('admin'),
                authPlugin.preware.ensureAdminGroup('root')
            ]
        },
        handler: function (request, reply) {

            var Session = request.server.plugins.models.Session;

            Session.findByIdAndRemove(request.params.id, function (err, count) {

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
    name: 'sessions'
};
