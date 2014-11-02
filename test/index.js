var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var composer = require('../index');


lab.experiment('App', function () {

    lab.test('it composes the server pack', function (done) {

        composer(function (err, composedPack) {

            Code.expect(composedPack).to.be.an.object();

            done(err);
        });
    });
});
