var Hoek = require('hoek');
var fs = require('fs');
var handlebars = require('handlebars');
var nodemailer = require('nodemailer');
var markdown = require('nodemailer-markdown').markdown;
var config = require('../config');


var transport = nodemailer.createTransport(config.get('/nodemailer'));
    transport.use('compile', markdown({ useEmbeddedImages: true }));


var templateCache = {};


var renderTemplate = function (signature, context, callback) {

    if (templateCache[signature]) {
        return callback(null, templateCache[signature](context));
    }

    var filePath = __dirname + '/emails/' + signature + '.hbs.md';
    var options = { encoding: 'utf-8' };

    fs.readFile(filePath, options, function (err, source) {

        if (err) {
            return callback(err);
        }

        templateCache[signature] = handlebars.compile(source);
        callback(null, templateCache[signature](context));
    });
};


var sendEmail = exports.sendEmail = function(options, template, context, callback) {

    renderTemplate(template, context, function (err, content) {

        if (err) {
            return callback(err);
        }

        options = Hoek.applyToDefaults(options, {
            from: config.get('/system/fromAddress'),
            markdown: content
        });

        transport.sendMail(options, callback);
    });
};


exports.register = function (plugin, options, next) {

    plugin.expose('sendEmail', sendEmail);
    plugin.expose('transport', transport);

    next();
};


exports.register.attributes = {
    name: 'mailer'
};
