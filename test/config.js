var Lab = require('lab');
var lab = exports.lab = Lab.script();
var config = require('../config');


lab.experiment('Config', function () {

    lab.test('it gets config data', function (done) {

        Lab.expect(config.get('/')).to.be.an('object');

        done();
    });


    lab.test('it gets config meta data', function (done) {

        Lab.expect(config.meta('/')).to.match(/this file configures the plot device/i);

        done();
    });
});
