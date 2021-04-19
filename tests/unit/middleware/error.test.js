const error = require('../../../middleware/error');

describe('error handling middleware' , () => {
    let err;
    let req;
    let res;
    let next;

    beforeEach(() => {
        err = new Error('error');

        req = {};
    
        res = {
            send: jest.fn(),
            status: jest.fn(() => res)
        };
    
        next = {};

        console.log = jest.fn();
    });
    
    // test res.status(500)

    it('should return status 500 if an error is caught' , () => {
        let status = 500;

        error(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(status);
    });

    it('should return a message to the client' , () => {
        error(err, req, res, next);

        expect(res.send).toHaveBeenCalled();
    });

    // test console.log has been called

    it('it should call console.log and display the error' , () => {
        error(err, req, res, next);

        expect(console.log).toHaveBeenCalledWith('Error Message:' , err);
    })
});

// jest.fn().mockImplementation(() => {throw Error('error')});

