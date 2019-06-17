const express = require('express');
const router = require('./router')

const api = express();

api.use(express.urlencoded({ extended: false }));
api.use(express.json());

api.use('/', router)

module.exports = api;