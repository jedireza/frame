exports.register = function (plugin, options, next) {

    plugin.route({
        method: 'DELETE',
        path: '/logout',
        config: {
            auth: 'simple'
        },
        handler: function (request, reply) {

            var Session = request.server.plugins.models.Session;
            var query = {
                username: request.auth.credentials.user.username
            };

            Session.remove(query, function (err, count) {

                if (err) {
                    return reply(err);
                }

                if (count === 0) {
                    return reply({ message: 'Session not found. That is strange.' }).code(404);
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
