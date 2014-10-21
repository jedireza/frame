var Confidence = require('confidence');
var config = require('./config');
var criteria = {
    env: process.env.NODE_ENV
};


var manifest = {
    $meta: 'This file defines the plot device.',
    servers: [{
        port: config.get('/port/web'),
        options: {
            security: true,
            debug: {
                request: ['error']
            },
            labels: ['web']
        }
    }],
    plugins: {
        'hapi-auth-basic': {},
        'lout': {},
        'visionary': {
            engines: { jade: 'jade' },
            path: './plugins/web'
        },
        './plugins/auth': {},
        './plugins/models': {},
        './plugins/mailer': {},
        './plugins/api/accounts': { basePath: '/api' },
        './plugins/api/admin-groups': { basePath: '/api' },
        './plugins/api/admins': { basePath: '/api' },
        './plugins/api/auth-attempts': { basePath: '/api' },
        './plugins/api/contact': { basePath: '/api' },
        './plugins/api/index': { basePath: '/api' },
        './plugins/api/login': { basePath: '/api' },
        './plugins/api/logout': { basePath: '/api' },
        './plugins/api/sessions': { basePath: '/api' },
        './plugins/api/signup': { basePath: '/api' },
        './plugins/api/statuses': { basePath: '/api' },
        './plugins/api/users': { basePath: '/api' },
        './plugins/web/index': {}
    }
};


var store = new Confidence.Store(manifest);


exports.get = function (key) {

    return store.get(key, criteria);
};


exports.meta = function (key) {

    return store.meta(key, criteria);
};
