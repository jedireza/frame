'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const StatusEntry = require('../../../server/models/status-entry');


const lab = exports.lab = Lab.script();


lab.experiment('Status Model', () => {

    lab.test('it instantiates an instance', () => {

        const statusEntry = new StatusEntry({
            id: 'account-happy',
            name: 'Happy',
            adminCreated: {
                id: '111111111111111111111111',
                name: 'Root Admin'
            }
        });

        Code.expect(statusEntry).to.be.an.instanceOf(StatusEntry);
    });
});
