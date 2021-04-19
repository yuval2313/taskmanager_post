// create task model
// implement prepared queries
// prepared queries also instance methods? --> .save() , .delete() , .update() etc..

const client = require('../startup/db');

const Joi = require('joi');

const statusList = ['not started' , 'in progress' , 'complete'];
const priorityList = ['low' , 'medium' , 'high' , 'urgent'];

class Task {

    constructor(title , content , status , priority , user_id , id) {
        this.title = title;
        this.content = content;
        this.status = status;
        this.priority = priority;
        this.user_id = user_id;
        this.create_date = new Date().toJSON()
        this.id = id;
    }

    //Instance methods

    async save () {
        const query = {
            text: 'INSERT INTO tasks ( title , content , status , priority , user_id , create_date ) VALUES ( $1 , $2 , $3 , $4 , $5 , $6)',
            values: [this.title , this.content , this.status , this.priority , this.user_id , this.create_date]
        }
        
        return await client.query(query);
    }

    async updateById(id) {
        const query = {
            text: 'UPDATE tasks SET title = $1 , content = $2 , status = $3 , priority = $4 WHERE id = $5',
            values: [ this.title , this.content , this.status , this.priority , id ]
        } 
        
        return await client.query(query);
    }

    //Static methods

    static async queryAllByUserId (user_id) {
        const query = {
            text: 'SELECT * FROM tasks WHERE user_id = $1',
            values: [ user_id ]
        }
        
        return (await client.query(query)).rows;
    }

    static async queryOneById (id) {
        const query = {
            text: 'SELECT * FROM tasks WHERE id = $1',
            values: [ id ]
        }
        
        return (await client.query(query)).rows[0];
    }

    static async queryOneByIdAndUserId (id , user_id) {
        const query = {
            text: 'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            values: [ id , user_id]
        }
        
        return (await client.query(query)).rows[0];
    }

    static async deleteOneById (id) {
        const query = {
            text: 'DELETE FROM tasks WHERE id = $1',
            values: [ id ]
        } 
        
        return await client.query(query);
    }
}

function taskValidation(task) {
    const schema = Joi.object({
        title: Joi.string().min(3).max(50).required(),
        content: Joi.string().required(),
        status: Joi.string().valid(...statusList).required(),
        priority: Joi.string().valid(...priorityList).required(),
    });

    return schema.validate(task);
}

exports.Task = Task;
exports.taskValidation = taskValidation;