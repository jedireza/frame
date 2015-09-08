var Hoek = require('hoek');
var Fs = require('fs');
var Handlebars = require('handlebars');
var Nodemailer = require('nodemailer');
var Markdown = require('nodemailer-markdown').markdown;
var Config = require('../config');


var internals = {};


internals.transport = Nodemailer.createTransport(Config.get('/nodemailer'));
internals.transport.use('compile', Markdown({ useEmbeddedImages: true }));


internals.templateCache = {};


internals.renderTemplate = function (signature, context, callback) {

    if (internals.templateCache[signature]) {
        return callback(null, internals.templateCache[signature](context));
    }

    var filePath = __dirname + '/emails/' + signature + '.hbs.md';
    var options = { encoding: 'utf-8' };

    Fs.readFile(filePath, options, function (err, source) {

        if (err) {
            return callback(err);
        }

        internals.templateCache[signature] = Handlebars.compile(source);
        callback(null, internals.templateCache[signature](context));
    });
};


internals.sendEmail = function (options, template, context, callback) {

    internals.renderTemplate(template, context, function (err, content) {

        if (err) {
            return callback(err);
        }

        options = Hoek.applyToDefaults(options, {
            from: Config.get('/system/fromAddress'),
            markdown: content
        });

        internals.transport.sendMail(options, callback);
    });
};


exports.register = function (server, options, next) {

    server.expose('sendEmail', internals.sendEmail);
    server.expose('transport', internals.transport);

    next();
};


exports.sendEmail = internals.sendEmail;


exports.register.attributes = {
    name: 'mailer'
};
