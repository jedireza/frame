var Boom = require('boom');
var Joi = require('joi');
var Hoek = require('hoek');
var AuthPlugin = require('../auth');


var internals = {};


internals.applyRoutes = function (server, next) {

    var Session = server.plugins['hapi-mongo-models'].Session;


    server.route({
        method: 'GET',
        path: '/sessions',
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

            Session.pagedFind(query, fields, sort, limit, page, function (err, results) {

                if (err) {
                    return reply(err);
                }

                reply(results);
            });
        }
    });


    server.route({
        method: 'GET',
        path: '/sessions/{id}',
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

            Session.findById(request.params.id, function (err, session) {

                if (err) {
                    return reply(err);
                }

                if (!session) {
                    return reply(Boom.notFound('Document not found.'));
                }

                reply(session);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/sessions/{id}',
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

            Session.findByIdAndDelete(request.params.id, function (err, session) {

                if (err) {
                    return reply(err);
                }

                if (!session) {
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
    name: 'sessions'
};
