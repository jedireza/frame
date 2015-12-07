'use strict';

const Lab = require('lab');
const Code = require('code');
const Composer = require('../index');


const lab = exports.lab = Lab.script();


lab.experiment('App', () => {

    lab.test('it composes a server', (done) => {

        Composer((err, composedServer) => {

            Code.expect(composedServer).to.be.an.object();

            done(err);
        });
    });
});
