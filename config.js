'use strict';
const Confidence = require('confidence');
const Dotenv = require('dotenv');


Dotenv.config({ silent: true });

const criteria = {
    env: process.env.NODE_ENV
};


const config = {
    $meta: 'This file configures the plot device.',
    projectName: 'Frame',
    port: {
        web: {
            $filter: 'env',
            test: 9090,
            production: process.env.PORT,
            $default: 9000
        }
    },
    authAttempts: {
        forIp: 50,
        forIpAndUser: 7
    },
    hapiMongoModels: {
        mongodb: {
            connection: {
                uri: {
                    $filter: 'env',
                    production: process.env.MONGODB_URI,
                    $default: 'mongodb://localhost:27017/'
                },
                db: {
                    $filter: 'env',
                    production: process.env.MONGODB_DB_NAME,
                    test: 'frame-test',
                    $default: 'frame'
                }
            }
        },
        autoIndex: true
    },
    nodemailer: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'jedireza@gmail.com',
            pass: process.env.SMTP_PASSWORD
        }
    },
    system: {
        fromAddress: {
            name: 'Frame',
            address: 'jedireza@gmail.com'
        },
        toAddress: {
            name: 'Frame',
            address: 'jedireza@gmail.com'
        }
    }
};


const store = new Confidence.Store(config);


exports.get = function (key) {

    return store.get(key, criteria);
};


exports.meta = function (key) {

    return store.meta(key, criteria);
};
