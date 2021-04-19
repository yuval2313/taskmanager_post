const request = require('supertest');
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const config = require('config');

const client = require('../../../startup/db');
const {generateAuthToken , User} = require('../../../models/user');

let server;
const endpoint = '/api/users';

describe(endpoint , () => {
    let user;

    beforeEach(() => {
        server = require('../../../index'); 
    });

    afterEach(async () => {
        await server.close();
        await client.query('DELETE FROM users');
    });

    describe('POST /' , () => {
        const exec = () => {
            return request(server)
                .post(endpoint)
                .send(user)
        }

        beforeEach(() => {
            user = {
                first_name: 'firstname',
                last_name: 'lastname',
                email: 'email@email.com',
                password: 'aA12345678'
            }

            // user = new User('firstname', 'lastname' , 'email@email.com' , 'password');

        });

        //Joi validation

        it('should return status 400 if email is invalid' , async () => {
            user.email = 'email.com';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if email is longer than 50 characters' , async () => {
            const fortyOneChar = new Array(42).join('a');
            user.email = fortyOneChar + '@email.com';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if email is less than 3 characters' , async () => {
            user.email = '@1.';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password is less than 8 characters' , async () => {
            user.password = 'aA12345';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password is more than 50 characters' , async () => {
            const fortyOneChar = new Array(42).join('a');
            user.password = fortyOneChar + 'aA12345678'

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password doesn\'t contain any numbers' , async () => {
            user.password = 'AbcdefghijK';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password doesn\'t contain any uppercase letters' , async () => {
            user.password = 'a12345678';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if password doesn\'t contain any lowercase letters' , async () => {
            user.password = 'A12345678';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if first_name is less than 3 characters' , async () => {
            user.first_name = 'a';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if first_name is more than 50 characters' , async () => {
            const fortyOneChar = new Array(42).join('a');
            user.first_name = 'abcdefghij' + fortyOneChar;

            const res = await exec();

            expect(res.status).toBe(400);
        });
        
        it('should return status 400 if last_name is less than 3 characters' , async () => {
            user.last_name = 'a';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if last_name is more than 50 characters' , async () => {
            const fortyOneChar = new Array(42).join('a');
            user.last_name = 'abcdefghij' + fortyOneChar;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        //DB validation

        it('should return status 400 if user has already registered before' , async () => {
            await client.query(
                'INSERT INTO users (first_name , last_name , email , password , create_date) VALUES ($1 , $2 , $3 , $4 , $5)',
                [user.first_name , user.last_name , user.email , user.password , user.create_date]
            );

            const res = await exec();

            expect(res.status).toBe(400);
        });

        //happy path

        it('should save the user to the database' , async () => {
            await exec();

            const dbUser = (await client.query(
                'SELECT * FROM users WHERE email = $1', [user.email]
            )).rows[0];

            expect(dbUser).toBeTruthy();
        });

        it('should save the user to the database with a hashed password' , async () => {
            await exec();

            const dbUser = (await client.query(
                'SELECT * FROM users WHERE email = $1', [user.email]
            )).rows[0];

            const valid = await bcrypt.compare(user.password , dbUser.password);

            expect(valid).toBeTruthy();
        });

        it('should return status 200 if valid request' , async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the JWT in the response header' , async () => {
            const res = await exec();

            // const dbUser = (await client.query(
            //     'SELECT * FROM users WHERE email = $1',
            //     [user.email]
            // )).rows[0];

            // const token = User.generateAuthToken(dbUser);

            const dbUser = await User.queryByEmail(user.email);

            // await user.getId();

            const token = dbUser.generateAuthToken();
            
            expect(res.header).toHaveProperty('x-auth-token' , token);
        });

        it('should return the new user to the client' , async () => {
            const res = await exec();

            expect(res.body).toMatchObject({first_name: user.first_name , last_name: user.last_name , email: user.email});
        });
    });

    describe('GET /me' , () => {
        let token;

        const exec = () => {
            return request(server)
                .get(endpoint + '/me')
                .set('x-auth-token' , token)
        }

        beforeEach(async () => {

            user = new User('firstname' , 'lastname' , 'email@email.com' , 'aA12345678' , 1);

            await client.query(
                'INSERT INTO users (id , first_name , last_name , email , password , create_date) VALUES ($1 , $2 , $3 , $4 , $5 ,$6)',
                [user.id , user.first_name , user.last_name , user.email , user.password , user.create_date]
            );

            token = user.generateAuthToken();
        });

        //authentication

        it('should return status 401 if no token is provided' , async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return status 400 if invalid token is provided' , async () => {
            token = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        //happy path

        it('should return status 200 if user is logged in' , async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the user based on the payload of the given token' , async () => {
            const decoded = jwt.verify(token , config.get('jwtPrivateKey'));
            delete decoded.iat;
            
            const res = await exec();

            expect(res.body).toEqual(expect.objectContaining(decoded));
        });
    });
});