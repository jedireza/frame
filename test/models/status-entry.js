var Lab = require('lab');
var lab = exports.lab = Lab.script();
var StatusEntry = require('../../models/status-entry');


lab.experiment('Status Entry Class', function () {

    lab.test('it instantiates an instance', function (done) {

        var statusEntry = new StatusEntry({});

        Lab.expect(statusEntry).to.be.an.instanceOf(StatusEntry);

        done();
    });
});
