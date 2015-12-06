'use strict';

const Lab = require('lab');
const Code = require('code');
const Manifest = require('../manifest');


const lab = exports.lab = Lab.script();


lab.experiment('Manifest', () => {

    lab.test('it gets manifest data', (done) => {

        Code.expect(Manifest.get('/')).to.be.an.object();

        done();
    });


    lab.test('it gets manifest meta data', (done) => {

        Code.expect(Manifest.meta('/')).to.match(/this file defines the plot device/i);

        done();
    });
});
