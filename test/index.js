var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var composer = require('../index');


lab.experiment('App', function () {

    lab.test('it composes a server', function (done) {

        composer(function (err, composedServer) {

            Code.expect(composedServer).to.be.an.object();

            done(err);
        });
    });
});
