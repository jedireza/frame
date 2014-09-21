var Lab = require('lab');
var lab = exports.lab = Lab.script();
var config = require('../../config');
var Hapi = require('hapi');
var proxyquire = require('proxyquire');
var stub = {
    BaseModel: {}
};
var modelsPlugin = proxyquire('../../plugins/models', {
    '../models/base': stub.BaseModel
});


lab.experiment('Models Plugin', function () {

    lab.test('it returns and error when the db connection fails', function (done) {

        var realConnect = stub.BaseModel.connect;
        stub.BaseModel.connect = function (callback) {

            callback(Error('connect failed'));
        };

        var server = new Hapi.Server(config.get('/port/api'));
        server.pack.register(modelsPlugin, function (err) {

            Lab.expect(err).to.be.an('object');

            stub.BaseModel.connect = realConnect;

            done();
        });
    });


    lab.test('it successfuly connects to the db and exposes models', function (done) {

        var server = new Hapi.Server(config.get('/port/api'));
        server.pack.register(modelsPlugin, function (err) {

            if (err) {
                return done(err);
            }

            Lab.expect(server.plugins.models).to.be.an('object');
            Lab.expect(server.plugins.models.BaseModel).to.be.an('object');

            server.plugins.models.BaseModel.disconnect();

            done();
        });
    });
});
