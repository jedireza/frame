'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Manifest = require('../manifest');


const lab = exports.lab = Lab.script();


lab.experiment('Manifest', () => {

    lab.test('it gets manifest data', () => {

        Code.expect(Manifest.get('/')).to.be.an.object();
    });


    lab.test('it gets manifest meta data', () => {

        Code.expect(Manifest.meta('/')).to.match(/this file defines the plot device/i);
    });
});
