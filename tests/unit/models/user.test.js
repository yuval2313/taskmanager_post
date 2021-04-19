const jwt = require('jsonwebtoken');
const config = require('config');

const {User} = require('../../../models/user');

describe('generateAuthToken' , () => {

    it('should generate a valid JSON token for a user' , () => { 

        const user = new User('firstname' , 'lastname' , 'email@email.com' , 'aA12345678' , 1);

        const payload = {
            id: user.id, 
            email: user.email
        };

        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'))

        expect(decoded).toMatchObject(payload);
    })
});

//test prepared queries