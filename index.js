const express = require('express');
const api = require('./api');
const config = require('./config');
const { connection } = require('./services/db.service');

const server = express();

server.use(express.urlencoded({ extended: false }));
server.use(express.json());

server.use('/api/', api);

server.get('/', (req, res) => {
  res.json({ ok: true });
});

server.listen(config.port, () => {
  console.log(`Server run on port: ${config.port}`);
});
