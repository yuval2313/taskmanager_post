// create user model
// reimplement generateAuthToken as an instance method
// implement prepared queries
// prepared queries also instance methods? --> .save() , .delete() , .update() etc..
const client = require('../startup/db');

const jwt = require('jsonwebtoken');
const config = require('config');

const Joi = require('joi');
const passwordComplexity = require("joi-password-complexity");

class User {

    constructor(first_name , last_name , email , password , id) {
        this.first_name = first_name,
        this.last_name = last_name,
        this.email = email,
        this.password = password,
        this.create_date = new Date().toJSON()
        this.id = id
    }

    //Instance methods

    async save () {
        const query = {
            text: 'INSERT INTO users (first_name , last_name , email , password , create_date) VALUES ($1 , $2 , $3 , $4 , $5)',
            values: [this.first_name , this.last_name , this.email , this.password , this.create_date]
        }
    
        const result = await client.query(query);

        await this.getId();

        return result;
    }

    async getId () {
        const query = {
            text: 'SELECT id FROM users WHERE email = $1',
            values: [ this.email ]
        } 

        const {id} = (await client.query(query)).rows[0]; 

        this.id = id;

        return id;
    }

    generateAuthToken () {
        if(!this.id) throw new Error('Cannot Create Token - Missing \'id\' property!')

        const token = jwt.sign({id: this.id , email: this.email} , config.get('jwtPrivateKey'));
        return token;
    }

    //Static methods
    
    static async queryByEmail (email) {
        const query = {
            text: 'SELECT * FROM users WHERE email = $1',
            values: [ email ]
        }
    
        const user = (await client.query(query)).rows[0];

        if(!user) return user;

        return new User(user.first_name , user.last_name , user.email , user.password , user.id);
    }

    static async queryById (id) {
        const query = {
            text: 'SELECT * FROM users WHERE id = $1',
            values: [ id ]
        }
    
        const user = (await client.query(query)).rows[0];
        
        if(!user) return user;

        return new User(user.first_name , user.last_name , user.email , user.password , user.id);
    }
  
};

const complexityOptions = {
  min: 8,
  max: 50,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 0,
  requirementCount: 3,
};

function userValidation (user) {
    const schema = Joi.object({
        first_name: Joi.string().min(3).max(30).required(),
        last_name: Joi.string().min(3).max(30).required(),
        email: Joi.string().min(3).max(50).email().required(),
        password: passwordComplexity(complexityOptions, 'Password')
    });

    return schema.validate(user);
}

function loginValidation (user) {
    const schema = Joi.object({
        email: Joi.string().min(3).max(50).email().required(),
        password: passwordComplexity(complexityOptions, 'Password')
    });

    return schema.validate(user);
}

exports.User = User;
exports.userValidation = userValidation;
exports.loginValidation = loginValidation;