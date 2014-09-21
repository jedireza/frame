var Lab = require('lab');
var lab = exports.lab = Lab.script();
var composer = require('../index');


lab.experiment('App', function () {

    lab.test('it composes the server pack', function (done) {

        composer(function (err, composedPack) {

            Lab.expect(composedPack).to.be.an('object');

            done(err);
        });
    });
});
