const request = require('supertest');
const bcrypt = require('bcrypt');

const client = require('../../../startup/db');
const {User} = require('../../../models/user');

let server;
const endpoint = '/api/login';

describe(endpoint , () => {

    beforeEach(() => {
        server = require('../../../index');
    });

    afterEach(async () => {
        await server.close();
        await client.query('DELETE FROM users');
    });

    describe('POST /' , () => {
        let user;
        let email;
        let password;

        const exec = () => {
            return request(server)
                .post(endpoint)
                .send({ email , password });
        };

        beforeEach(async () => {
            email = 'email@email.com';
            password = 'aA12345678';

            user = new User('firstname' , 'lastname' , email , password , 1)

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password , salt);

            await client.query(
                'INSERT INTO users (id , first_name , last_name , email , password , create_date) VALUES ($1 , $2 , $3 , $4 , $5 , $6)',
                [user.id , user.first_name , user.last_name , user.email , user.password , user.create_date]
            );
        });

        //Joi validation
        
        it('should return status 400 if email is invalid' , async () => {
            email = 'email.com';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if email is longer than 50 characters' , async () => {
            const fortyOneChar = new Array(42).join('a');
            email = fortyOneChar + '@email.com';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if email is less than 3 characters' , async () => {
            email = '@1.';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password is less than 8 characters' , async () => {
            password = 'aA12345';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password is more than 50 characters' , async () => {
            const fortyOneChar = new Array(42).join('a');
            password = fortyOneChar + 'aA12345678'

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password doesn\'t contain any numbers' , async () => {
            password = 'AbcdefghijK';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password doesn\'t contain any uppercase letters' , async () => {
            password = 'a12345678';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password doesn\'t contain any lowercase letters' , async () => {
            password = 'A12345678';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        //DB validation

        it('should return status 404 when user with the given email is not found in the database' , async () => {
            email = 'bademail@bademail.com';

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return status 404 when password does not match the user found with the given email' , async () => {
            password = 'bB12345678';

            const res = await exec();

            expect(res.status).toBe(404);
        });

        //happy path

        it('should return status 200 if valid request' , async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return return a valid JWT to the client in the body of the response' , async () => {
            const res = await exec();
            
            const token = user.generateAuthToken();

            expect(res.text).toEqual(token);
        });
    });
});