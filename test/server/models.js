var Lab = require('lab');
var Code = require('code');
var Config = require('../../config');
var Hapi = require('hapi');
var Proxyquire = require('proxyquire');


var lab = exports.lab = Lab.script();
var stub = {
    BaseModel: {}
};
var ModelsPlugin = Proxyquire('../../server/models', {
    './models/base': stub.BaseModel
});


lab.experiment('Models Plugin', function () {

    lab.test('it returns and error when the db connection fails', function (done) {

        var realConnect = stub.BaseModel.connect;
        stub.BaseModel.connect = function (callback) {

            callback(Error('connect failed'));
        };

        var server = new Hapi.Server();
        server.connection({ port: Config.get('/port/web') });
        server.register(ModelsPlugin, function (err) {

            Code.expect(err).to.be.an.object();

            stub.BaseModel.connect = realConnect;

            done();
        });
    });


    lab.test('it successfuly connects to the db and exposes models', function (done) {

        var server = new Hapi.Server();
        server.connection({ port: Config.get('/port/web') });
        server.register(ModelsPlugin, function (err) {

            if (err) {
                return done(err);
            }

            Code.expect(server.plugins.models).to.be.an.object();
            Code.expect(server.plugins.models.BaseModel).to.be.an.object();

            server.plugins.models.BaseModel.disconnect();

            done();
        });
    });
});
