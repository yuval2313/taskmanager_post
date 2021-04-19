const express = require('express');
const router = express.Router();

const _ = require('lodash');

const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

const {taskValidation , Task} = require('../models/task');


router.get('/' , auth  , async (req, res) => {
    const user_id = req.user.id;

    const tasks = await Task.queryAllByUserId(user_id);

    if(tasks.length === 0) return res.status(404).send('No tasks found!');

    res.send(tasks);
});

router.get('/:id' , auth , async (req, res) => {
    const {id} = req.params;
    const user_id = req.user.id;

    const task = await Task.queryOneByIdAndUserId(id , user_id);

    if(!task) return res.status(404).send('No tasks found!');
    
    res.send(task);
});

router.post('/' , [auth , validation(taskValidation)] , async (req, res) => {
    const user_id = req.user.id;
    const {title , content , status , priority} = req.body;

    const task = new Task(title , content , status , priority , user_id);

    await task.save();

    res.send(task);
});

router.put('/:id' , [auth , validation(taskValidation)] , async (req, res) => {
    const {id} = req.params;
    const user_id = req.user.id;
    const {title , content , status , priority} = req.body;

    let task = await Task.queryOneByIdAndUserId( id , user_id);

    if(!task) return res.status(404).send('Task with the given ID cannot be found!');

    task = new Task(title , content , status , priority , user_id);
    task.updateById(id);

    res.send(task);
});

router.delete('/:id' , auth , async (req , res) => {
    const {id} = req.params;
    const user_id = req.user.id;

    const task = await Task.queryOneByIdAndUserId(id, user_id);

    if(!task) return res.status(404).send('Task with the given ID cannot be found!');

    await Task.deleteOneById(id);
    
    res.send(task);
});

module.exports = router;