const request = require('supertest');
const client = require('../../../startup/db');

let server;
const endpoint = '/api/users';

describe('validation middleware' , () => {
    let user;

    const exec = () => {
        return request(server)
            .post(endpoint)
            .send(user);
    }

    beforeEach(() => {
        server = require('../../../index');

        user = {
            first_name: 'firstname',
            last_name: 'lastname',
            password: 'aA12345678',
            email: 'email@email.com',
        };
    });

    afterEach(async () => {
        await server.close();
        await client.query('DELETE FROM users');
    });

    it('it should return status 400 if validation is unsuccessfull' , async () => {
        user.first_name = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });
});