const express = require('express');
require('express-async-errors');

const tasks = require('../routes/tasks');
const users = require('../routes/users');
const login = require('../routes/login');
const error = require('../middleware/error');

// playground
const playground = require('../playground');

module.exports = function (app) {
    app.use(express.json());
    app.use('/api/tasks' , tasks);
    app.use('/api/users' , users);
    app.use('/api/login' , login);
    app.use(error);

    // playground
    app.use('/playground' , playground);
}