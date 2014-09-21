var async = require('async');


exports.register = function (plugin, options, next) {

    plugin.servers.forEach(function (server) {

        server.auth.strategy('simple', 'basic', {
            validateFunc: function (username, password, callback) {

                var Session = plugin.plugins.models.Session;
                var User = plugin.plugins.models.User;

                async.auto({
                    session: function (done) {

                        Session.findByCredentials(username, password, done);
                    },
                    user: ['session', function (done, results) {

                        if (!results.session) {
                            return done();
                        }

                        User.findByUsername(username, done);
                    }],
                    roles: ['user', function (done, results) {

                        if (!results.user) {
                            return done();
                        }

                        results.user.hydrateRoles(done);
                    }]
                }, function (err, results) {

                        if (err) {
                            return callback(err);
                        }

                        if (!results.session) {
                            return callback(null, false);
                        }

                        callback(null, Boolean(results.user), results);
                });
            }
        });
    });

    next();
};


exports.preware = {};


exports.preware.ensureUserRole = function (roles) {

    return {
        assign: 'ensureUserRole',
        method: function (request, reply) {

            if (Object.prototype.toString.call(roles) !== '[object Array]') {
                roles = [roles];
            }

            var roleFound = roles.some(function (role) {

                return request.auth.credentials.user.canPlayRole(role);
            });

            if (!roleFound) {
                var response = {
                    message: 'Permission denied to this resouce.'
                };

                return reply(response).takeover().code(403);
            }

            reply();
        }
    };
};


exports.preware.ensureAdminGroup = function (groups) {

    return {
        assign: 'ensureAdminGroup',
        method: function (request, reply) {

            if (Object.prototype.toString.call(groups) !== '[object Array]') {
                groups = [groups];
            }

            var groupFound = groups.some(function (group) {

                return request.auth.credentials.roles.admin.isMemberOf(group);
            });

            if (!groupFound) {
                var response = {
                    message: 'Permission denied to this resouce.'
                };

                return reply(response).takeover().code(403);
            }

            reply();
        }
    };
};


exports.register.attributes = {
    name: 'auth'
};
