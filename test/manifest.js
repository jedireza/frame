var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var manifest = require('../manifest');


lab.experiment('Manifest', function () {

    lab.test('it gets manifest data', function (done) {

        Code.expect(manifest.get('/')).to.be.an.object();

        done();
    });


    lab.test('it gets manifest meta data', function (done) {

        Code.expect(manifest.meta('/')).to.match(/this file defines the plot device/i);

        done();
    });
});
