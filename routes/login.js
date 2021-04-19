const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const {loginValidation , User} = require('../models/user');

const validation = require('../middleware/validation');

router.post('/' , validation(loginValidation) , async (req , res) => {
    const { email , password } = req.body;

    const user = await User.queryByEmail(email);
    if(!user) return res.status(404).send('Invalid email or password!');

    const valid = await bcrypt.compare(password , user.password);
    if(!valid) return res.status(404).send('Invalid email or password!');

    const token = user.generateAuthToken();
    res.send(token);
});

module.exports = router;