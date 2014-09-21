var Lab = require('lab');
var lab = exports.lab = Lab.script();
var composer = require('../../../index');
var webServer;


lab.experiment('Home Page View', function () {

    lab.before(function (done) {

        composer(function (err, composedPack) {

            webServer = composedPack._servers[0];

            done();
        });
    });


    lab.after(function (done) {

        webServer.plugins.models.BaseModel.disconnect();

        done();
    });


    lab.test('home page renders properly', function (done) {

        var options = {
            method: 'GET',
            url: '/'
        };

        webServer.inject(options, function (response) {

            Lab.expect(response.result).to.match(/activate the plot device/i);
            Lab.expect(response.statusCode).to.equal(200);

            done();
        });
    });
});
