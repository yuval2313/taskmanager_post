const request = require('supertest');

const client = require('../../../startup/db');
const {User} = require('../../../models/user');

let server;
const endpoint = '/api/tasks'

describe('auth middleware' , () => {
    let user;
    let token;
    let task

    const exec = () => {
        return request(server)
            .post(endpoint)
            .set('x-auth-token' , token)
            .send(task);
    }

    beforeEach(async () => {
        server = require('../../../index');

        user = new User('firstname' , 'lastname' , 'email@email.com' , 'aA12345678' , 1);

        token = user.generateAuthToken();

        await client.query(
            'INSERT INTO users (id , first_name , last_name , email , password , create_date) VALUES ($1 , $2 , $3 , $4 , $5 , $6)',
            [user.id , user.first_name , user.last_name , user.email , user.password , user.create_date]
        );

        task = {
            title: 'title1',
            status: 'not started',
            content: 'content',
            priority: 'low',
            user_id: 1,
            create_date: new Date()
        };

    });

    afterEach(async () => {
        await server.close();
        await client.query('DELETE FROM tasks');
        await client.query('DELETE FROM users');
    });

    it('should return status 401 if no token is provided' , async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('should return status 400 if an invalid token is provided' , async () => {
        token = 'a';

        const res = await exec();

        expect(res.status).toBe(400);
    });
}); 