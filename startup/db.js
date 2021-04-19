const config = require('config');

const {Client} = require('pg');


const client = new Client(
    {
        user: config.get('PGUSER'),
        password: config.get('PGPASSWORD'),
        host: config.get('PGHOST'),
        port: config.get('PGPORT'),
        database: config.get('PGDATABASE')
    }
);

module.exports = {
    connect: () => {
        client.connect()
        .then(() => { console.log(`Connected to ${config.get('PGDATABASE')}`) })
        .catch((err) => { console.log('Something Failed: ' + err) });
    },
    query: (text, params) => client.query(text, params),
    end: () => client.end()
};

