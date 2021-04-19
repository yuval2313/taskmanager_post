const request = require('supertest');

const client = require('../../../startup/db');
const {User} = require('../../../models/user');

let server;
const endpoint = '/api/tasks';

describe(endpoint , () => {
    let user;
    let token;

    beforeEach(async () => {
        server = require('../../../index');

        user = new User('firstname' , 'lastname' , 'email@email.com' , 'aA12345678' , 1);

        await client.query(
            'INSERT INTO users (id , first_name , last_name , email , password , create_date) VALUES ($1 , $2 , $3 , $4 , $5 ,$6)',
            [user.id , user.first_name , user.last_name , user.email , user.password , user.create_date]
        );
        
        token = user.generateAuthToken(); 
    });

    afterEach(async () => {
        await server.close();
        await client.query('DELETE FROM tasks'); //IMPORTANT: DELETE FROM tasks BEFORE users , violates fkey in pg !!!
        await client.query('DELETE FROM users'); 
    });

    describe('GET /' , () => {
        let task1;
        let task2;
        let tasks;

        const exec = () => {
            return request(server)
                .get(endpoint)
                .set('x-auth-token' , token);
        }

        beforeEach(async () => {
            task1 = {
                id: 1,
                title: 'title1',
                status: 'not started',
                priority: 'low',
                content: 'content',
                user_id: user.id,
                create_date: new Date().toJSON()
            }

            await client.query(
                'INSERT INTO tasks (id , title, status, priority, content, user_id, create_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [task1.id , task1.title , task1.status , task1.priority , task1.content , task1.user_id , task1.create_date]
            );

            task2 = {
                id: 2,
                title: 'title2',
                status: 'not started',
                priority: 'low',
                content: 'content',
                user_id: user.id,
                create_date: new Date().toJSON()
            }

            await client.query(
                'INSERT INTO tasks (id , title, status, priority, content, user_id, create_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [task2.id , task2.title , task2.status , task2.priority , task2.content , task2.user_id , task2.create_date]
            );

            tasks = [task1 , task2];

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

        //DB validation

        it('should return status 404 if no tasks are found for the logged in user' , async () => {
            await client.query('DELETE FROM tasks WHERE user_id = $1' , [user.id]);

            const res = await exec();

            expect(res.status).toBe(404);
        });

        //happy path

        it('should return status 200 if valid request' , async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });
        
        it('should return all the logged in user\'s tasks in an array' , async () => {
            const res = await exec();

            expect(res.body).toEqual(tasks);
        });
    });

    describe('GET /:id' , () => {
        let task;
        let reqParamId;

        const exec = () => {
            return request(server)
                .get(endpoint + `/${reqParamId}`)
                .set('x-auth-token' , token);
        }

        beforeEach(async () => {
            reqParamId = 1;

            task = {
                id: reqParamId,
                title: 'title1',
                status: 'not started',
                priority: 'low',
                content: 'content',
                user_id: user.id,
                create_date: new Date().toJSON()
            }

            await client.query(
                'INSERT INTO tasks (id , title, status, priority, content, user_id, create_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [task.id , task.title , task.status , task.priority , task.content , task.user_id , task.create_date]
            );
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

        //DB validation

        it('should return status 404 if no task with the given id is found' , async () => {
            reqParamId = 2;

            const res = await exec();
            
            expect(res.status).toBe(404);
        });

        it('should return status 404 if no task with the given id is found for the logged in user' , async () => {
            await client.query('DELETE FROM tasks WHERE user_id = $1' , [user.id]);

            const res = await exec();

            expect(res.status).toBe(404);
        });

        //happy path

        it('should return status 200 if valid request' , async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the task with the given id to the client' , async () => {
            const res = await exec();

            expect(res.body).toMatchObject(task);
        });
    });

    describe('POST /' , () => {
        let task;

        const exec = () => {
            return request(server)
                .post(endpoint)
                .set('x-auth-token' , token)
                .send(task);
        }

        beforeEach(async () => {
            task = {
                title: 'title1',
                status: 'not started',
                priority: 'low',
                content: 'content',
            }
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

        //Joi validation

        it('should return status 400 if title is not given' , async () => {
            delete task.title;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if title is less than 3 characters' , async () => {
            task.title = 'aa';

            const res = await exec();

            expect(res.status).toBe(400);
        });
        
        it('should return status 400 if title is more than 50 characters' , async () => {
            task.title = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if content is not given' , async () => {
            delete task.content;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if status is not given' , async () => {
            delete task.status;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if status does not match [\'not started\' , \'in progress\' , \'complete\']' , async () => {
            task.status = 'status';
            let res = await exec();
            expect(res.status).toBe(400);

            task.status = 'not started';
            res = await exec();
            expect(res.status).toBe(200);

            task.status = 'in progress';
            res = await exec();
            expect(res.status).toBe(200);

            task.status = 'complete';
            res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return status 400 if priority is not given' , async () => {
            delete task.priority;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if priority does not match [\'low\' , \'medium\' , \'high\' , \'urgent\']' , async () => {
            task.priority = 'priority';
            let res = await exec();
            expect(res.status).toBe(400);

            task.priority = 'low';
            res = await exec();
            expect(res.status).toBe(200);

            task.priority = 'medium';
            res = await exec();
            expect(res.status).toBe(200);

            task.priority = 'high';
            res = await exec();
            expect(res.status).toBe(200);
            
            task.priority = 'urgent';
            res = await exec();
            expect(res.status).toBe(200);
        });

        //happy path
        it('should return status 200 if valid request' , async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should save the task to the database using the logged in user\'s ID' , async () => {
            await exec();

            const dbTask = (await client.query(
                'SELECT * FROM tasks WHERE user_id = $1' , [user.id]
            )).rows[0];

            expect(dbTask).toBeTruthy();
        });

        it('should return the new task to the user' , async () => {
            const res = await exec();

            expect(res.body).toEqual(expect.objectContaining(task));
        });

    });

    describe('PUT /:id' , () => {
        let task;
        let reqParamId;

        const exec = () => {
            return request(server)
                .put(endpoint + `/${reqParamId}`)
                .set('x-auth-token' , token)
                .send(task);
        }

        beforeEach(async () => {
            reqParamId = 1;

            task = {
                id: reqParamId,
                title: 'title1',
                status: 'not started',
                priority: 'low',
                content: 'content',
                user_id: user.id,
                create_date: new Date().toJSON()
            }

            await client.query(
                'INSERT INTO tasks (id , title, status, priority, content, user_id, create_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [task.id , task.title , task.status , task.priority , task.content , task.user_id , task.create_date]
            );

            task = {
                title: 'title2',
                status: 'in progress',
                priority: 'medium',
                content: 'new content'
            }
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

        //Joi validation

        it('should return status 400 if title is not given' , async () => {
            delete task.title;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if title is less than 3 characters' , async () => {
            task.title = 'aa';

            const res = await exec();

            expect(res.status).toBe(400);
        });
        
        it('should return status 400 if title is more than 50 characters' , async () => {
            task.title = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if content is not given' , async () => {
            delete task.content;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if status is not given' , async () => {
            delete task.status;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if status does not match [\'not started\' , \'in progress\' , \'complete\']' , async () => {
            task.status = 'status';
            let res = await exec();
            expect(res.status).toBe(400);

            task.status = 'not started';
            res = await exec();
            expect(res.status).toBe(200);

            task.status = 'in progress';
            res = await exec();
            expect(res.status).toBe(200);

            task.status = 'complete';
            res = await exec();
            expect(res.status).toBe(200);
        });

        it('should return status 400 if priority is not given' , async () => {
            delete task.priority;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return status 400 if priority does not match [\'low\' , \'medium\' , \'high\' , \'urgent\']' , async () => {
            task.priority = 'priority';
            let res = await exec();
            expect(res.status).toBe(400);

            task.priority = 'low';
            res = await exec();
            expect(res.status).toBe(200);

            task.priority = 'medium';
            res = await exec();
            expect(res.status).toBe(200);

            task.priority = 'high';
            res = await exec();
            expect(res.status).toBe(200);
            
            task.priority = 'urgent';
            res = await exec();
            expect(res.status).toBe(200);
        });

        //DB validation

        it('should return status 404 if no task with the given id is found' , async () => {
            reqParamId = 2;

            const res = await exec();
            
            expect(res.status).toBe(404);
        });

        it('should return status 404 if no task with the given id is found for the logged in user' , async () => {
            await client.query('DELETE FROM tasks WHERE user_id = $1' , [user.id]);

            const res = await exec();

            expect(res.status).toBe(404);
        });

        //happy path

        it('should update the task with the given ID in the database' , async () => {
            await exec();

            const dbTask = (await client.query(
                'SELECT * FROM tasks WHERE id = $1 LIMIT 1' , [reqParamId]
            )).rows[0];

            expect(dbTask).toEqual(expect.objectContaining(task));
        });

        it('should return status 200 if valid request' , async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the updated task back to the client' , async () => {
            const res = await exec();

            expect(res.body).toMatchObject(task);
        });
    });

    describe('DELETE /:id' , () => {
        let task;
        let reqParamId;

        const exec = () => {
            return request(server)
                .delete(endpoint + `/${reqParamId}`)
                .set('x-auth-token' , token);
        }

        beforeEach(async () => {
            reqParamId = 1;

            task = {
                id: reqParamId,
                title: 'title1',
                status: 'not started',
                priority: 'low',
                content: 'content',
                user_id: user.id,
                create_date: new Date().toJSON()
            }

            await client.query(
                'INSERT INTO tasks (id , title, status, priority, content, user_id, create_date) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [task.id , task.title , task.status , task.priority , task.content , task.user_id , task.create_date]
            );
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

        //DB validation

        it('should return status 404 if no task with the given id is found' , async () => {
            reqParamId = 2;

            const res = await exec();
            
            expect(res.status).toBe(404);
        });

        it('should return status 404 if no task with the given id is found for the logged in user' , async () => {
            await client.query('DELETE FROM tasks WHERE user_id = $1' , [user.id]);

            const res = await exec();

            expect(res.status).toBe(404);
        });

        //happy path

        it('should delete the task with the given id from the database' , async () => {
            await exec();

            const dbTask = (await client.query(
                'SELECT * FROM tasks WHERE id = $1' , [reqParamId]
            )).rows[0];

            expect(dbTask).toBeFalsy();
        });

        it('should return status 200 if valid request' , async () => {
            const res = await exec();

            expect(res.status).toBe(200);
        });

        it('should return the deleted task to the client' , async () => {
            const res = await exec();

            expect(res.body).toMatchObject(task);
        });

    });
});
