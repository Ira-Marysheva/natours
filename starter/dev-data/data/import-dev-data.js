const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('./../../models/tourModel');
const User = require('../..//models/userModel');
const Review = require('../../models/reviewModel');

//  reade and write variables fron the file
dotenv.config({ path: './config.env' });

//  console.log(process.env);
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
    console.log('DB connection successful!(send from mongoose)');
  });

//READE JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfylly loaded!!!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfylly delete!!!');
  } catch (err) {
    console.log(err.__dirname);
  }
  process.exit();
};

//this pice of code we use for reaction on colmd in the terminal and done some function
//example comand: node starter/dev-data/data/import-dev-data.js --import

if (process.argv[2] == '--import') {
  importData();
} else if (process.argv[2] == '--delete') {
  deleteData();
}
