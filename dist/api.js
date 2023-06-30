const mongoose = require('mongoose');
const dotenv = require('dotenv');
const serverless = require('serverless-http');

//UNCAUGHT EXCEPTIONS
process.on('uncaughtException', (err) => {
  console.log(err.stack);
  console.log('UNCAUGHT EXCEPTION😟. SHUTTIONG DOWN......');
  process.exit(1); //very abrupt way
});

dotenv.config({ path: './config.env' });

const app = require('../app');

mongoose
  .set('strictQuery', true)
  .connect(process.env.DATABASE_URL, {})
  .then(() => {
    console.log('DB connection successful!');
  });

module.exports.handler = serverless(app);
