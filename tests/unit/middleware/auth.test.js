const auth = require('../../../middleware/auth');
const {User} = require('../../../models/user');

describe('auth middleware' , () => {
    let payload;
    let user;
    let token;
    let req;
    let res;
    let next;

    beforeEach(() => {
        payload = {
            id: 1, 
            email: 'email@email.com'
        };

        user = new User('firstname' , 'lastname' , 'email@email.com' , 'aA12345678' , 1)

        token = user.generateAuthToken();
        
        req = {
            header: jest.fn().mockReturnValue(token)
        }
    
        res = {};
    
        next = jest.fn();
    });

    it('should populate req.user with the decoded payload' , () => {
        auth(req, res, next);

        expect(req.user).toMatchObject(payload);
    })

    it('it should call the next middleware function after populating req.body' , () => {
        auth(req, res, next);
        
        expect(next).toHaveBeenCalled();
    })
});