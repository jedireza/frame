'use strict';
const Session = require('./models/session');
const User = require('./models/user');


const register = function (server, options) {

    server.auth.strategy('simple', 'basic', {
        validate: async function (request, sessionId, key, h) {

            const session = await Session.findByCredentials(sessionId, key);

            if (!session) {
                return { isValid: false };
            }

            session.updateLastActive();

            const user = await User.findById(session.userId);

            if (!user) {
                return { isValid: false };
            }

            if (!user.isActive) {
                return { isValid: false };
            }

            const roles = await user.hydrateRoles();
            const credentials = {
                scope: Object.keys(user.roles),
                roles,
                session,
                user
            };

            return { credentials, isValid: true };
        }
    });

    server.auth.default('simple');
};


module.exports = {
    name: 'auth',
    dependencies: [
        'hapi-auth-basic',
        'hapi-mongo-models'
    ],
    register
};
