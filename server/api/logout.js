var Hoek = require('hoek');


exports.register = function (server, options, next) {

    options = Hoek.applyToDefaults({ basePath: '' }, options);


    server.route({
        method: 'DELETE',
        path: options.basePath + '/logout',
        config: {
            auth: {
                mode: 'try',
                strategy: 'simple'
            }
        },
        handler: function (request, reply) {

            var Session = request.server.plugins['hapi-mongo-models'].Session;
            var credentials = request.auth.credentials || { user: {} };
            var query = {
                username: credentials.user.username
            };

            Session.remove(query, function (err, count) {

                if (err) {
                    return reply(err);
                }

                if (count === 0) {
                    return reply({ message: 'Session not found.' }).code(404);
                }

                reply({ message: 'Success.' });
            });
        }
    });


    next();
};


exports.register.attributes = {
    name: 'logout'
};
