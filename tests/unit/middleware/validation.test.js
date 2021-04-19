const validation = require('../../../middleware/validation');

const {userValidation} = require('../../../models/user');

describe('validation middleware' , () => {
    let user;
    let req;
    let res;
    let next;

    beforeEach(() => {
        user = {
            first_name: 'firstname',
            last_name: 'lastname',
            password: 'aA12345678',
            email: 'email@email.com',
        };
        
        req = {
            body: user
        };
    
        res = {};
              
    
        next = jest.fn();
    });

    it('it should call the next middleware function after validation' , () => {
        const middleware = validation(userValidation);

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});