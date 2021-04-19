const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const _ = require('lodash');

const auth = require('../middleware/auth');

const {userValidation , User} = require('../models/user');

const validation = require('../middleware/validation');

router.post('/' , validation(userValidation) , async (req, res) => {
    const {first_name , last_name , email , password} = req.body;

    let user = await User.queryByEmail(email);
    if (user) return res.status(400).send('User already registered!');

    user = new User(first_name , last_name , email , password);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash( user.password , salt );

    await user.save();

    const token = user.generateAuthToken();

    res.header('x-auth-token' , token).send(user);
});

router.get('/me' , auth, async (req, res) => {
    const user = await User.queryById(req.user.id); 

    res.send(_.pick(user , ['id' , 'first_name' , 'last_name' , 'email']));
});

module.exports = router;