exports.register = function (plugin, options, next) {

    plugin.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {

            reply({ message: 'Welcome to the plot device.' });
        }
    });

    next();
};


exports.register.attributes = {
    name: 'home'
};
