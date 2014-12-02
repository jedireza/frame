var Confidence = require('confidence');
var config = require('./config');


var criteria = {
    env: process.env.NODE_ENV
};


var manifest = {
    $meta: 'This file defines the plot device.',
    server: {
        debug: {
            request: ['error']
        },
        connections: {
            routes: {
                security: true
            }
        }
    },
    connections: [{
        port: config.get('/port/web'),
        labels: ['web']
    }],
    plugins: {
        'hapi-auth-basic': {},
        'visionary': {
            engines: { jade: 'jade' },
            path: './server/web'
        },
        './server/models': {},
        './server/auth': {},
        './server/mailer': {},
        './server/api/accounts': { basePath: '/api' },
        './server/api/admin-groups': { basePath: '/api' },
        './server/api/admins': { basePath: '/api' },
        './server/api/auth-attempts': { basePath: '/api' },
        './server/api/contact': { basePath: '/api' },
        './server/api/index': { basePath: '/api' },
        './server/api/login': { basePath: '/api' },
        './server/api/logout': { basePath: '/api' },
        './server/api/sessions': { basePath: '/api' },
        './server/api/signup': { basePath: '/api' },
        './server/api/statuses': { basePath: '/api' },
        './server/api/users': { basePath: '/api' },
        './server/web/index': {}
    }
};


var store = new Confidence.Store(manifest);


exports.get = function (key) {

    return store.get(key, criteria);
};


exports.meta = function (key) {

    return store.meta(key, criteria);
};
