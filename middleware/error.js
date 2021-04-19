module.exports = function(err, req, res, next) {
    console.log('Error Message:', err);
    res.status(500).send('Something Failed!');
}