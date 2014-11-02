var Lab = require('lab');
var Code = require('code');
var lab = exports.lab = Lab.script();
var NoteEntry = require('../../models/note-entry');


lab.experiment('Status Entry Class', function () {

    lab.test('it instantiates an instance', function (done) {

        var noteEntry = new NoteEntry({});

        Code.expect(noteEntry).to.be.an.instanceOf(NoteEntry);

        done();
    });
});
