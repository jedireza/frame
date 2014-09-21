var Lab = require('lab');
var lab = exports.lab = Lab.script();
var composer = require('../../../index');


lab.experiment('Index', function () {

    var apiServer;

    lab.before(function (done) {

        composer(function (err, composedPack) {

            apiServer = composedPack._servers[1];

            done();
        });
    });


    lab.after(function (done) {

        apiServer.plugins.models.BaseModel.disconnect();

        done();
    });


    lab.test('it returns the default message', function (done) {

        var options = {
            method: 'GET',
            url: '/'
        };

        apiServer.inject(options, function (response) {

            Lab.expect(response.result.message).to.match(/welcome to the plot device/i);
            Lab.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});
