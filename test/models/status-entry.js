var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var StatusEntry = require('../../models/status-entry');


lab.experiment('Status Entry Class', function () {

    lab.test('it instantiates an instance', function (done) {

        var statusEntry = new StatusEntry({});

        Code.expect(statusEntry).to.be.an.instanceOf(StatusEntry);

        done();
    });
});
