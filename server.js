const mongoose = require('mongoose');
const dotenv = require('dotenv');

//UNCAUGHT EXCEPTIONS
process.on('uncaughtException', (err) => {
  //console.log(err);
  //console.log(`\n${err.name}: ${err.message}`);
  console.log(err.stack);
  console.log('UNCAUGHT EXCEPTION😟. SHUTTIONG DOWN......');
  process.exit(1); //very abrupt way
});

dotenv.config({ path: './config.env' });
const app = require('./app');

//  reade and write variables fron the file

//console.log(process.env);
mongoose
  .set('strictQuery', true)
  .connect(process.env.DATABASE_URL, {
    //in Mongoose 5 this properties not changed
    //useNewUrlParser: true,
    //useCreateIndex: true,
    //useFindAndModify: false,
    //usefindtopology: true,
  })
  .then(() => {
    console.log('DB connection successful!');
  });
// .catch((err) => console.log('ERROR'));

const port = process.env.PORT || 3000;
// it is numbet port simple is in file
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//UNHANDLED REJECTIONS
process.on('unhandledRejection', (err) => {
  // console.log(err); //\n ${err.name}: ${err.message}`
  console.log(`\n ${err.name}: ${err.message}`); //\n ${err.name}: ${err.message}`
  console.log('UNHANDLED REJECTIONS😫. SHUTTIONG DOWN......');
  //detter(gracefully) way
  server.close(() => process.exit(1));
  //process.exit(1); //very abrupt way
});

//example of uncaught exceptions
//console.log(x); //access not dafined
