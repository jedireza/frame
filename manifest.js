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
            debug: {
                request: ['error']
            },
            labels: ['web'],
            views: {
                engines: {
                    jade: require('jade')
                },
                path: './plugins/web'
            }
        }
    },{
        port: config.get('/port/api'),
        options: {
            debug: {
                request: ['error']
            },
            labels: ['api']
        }
    }],
    plugins: {
        'hapi-auth-basic': {},
        'lout': [{ select: 'api' }],
        './plugins/auth': {},
        './plugins/models': {},
        './plugins/mailer': {},
        './plugins/api/accounts': [{ select: 'api' }],
        './plugins/api/admin-groups': [{ select: 'api' }],
        './plugins/api/admins': [{ select: 'api' }],
        './plugins/api/auth-attempts': [{ select: 'api' }],
        './plugins/api/contact': [{ select: 'api' }],
        './plugins/api/index': [{ select: 'api' }],
        './plugins/api/login': [{ select: 'api' }],
        './plugins/api/logout': [{ select: 'api' }],
        './plugins/api/sessions': [{ select: 'api' }],
        './plugins/api/signup': [{ select: 'api' }],
        './plugins/api/statuses': [{ select: 'api' }],
        './plugins/api/users': [{ select: 'api' }],
        './plugins/web/index': [{ select: 'web' }]
    }
};


var store = new Confidence.Store(manifest);


exports.get = function (key) {

    return store.get(key, criteria);
};


exports.meta = function (key) {

    return store.meta(key, criteria);
};
