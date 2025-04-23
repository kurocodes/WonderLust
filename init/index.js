const mongoose = require('mongoose');
const initData  = require('./data.js');
const Listing = require('../models/listing.js');

const MONGO_URL = "mongodb://localhost:27017/Wanderlust";

main().then(() => {
    console.log('Connected to Database');
}).catch(err => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    // initData.data = initData.data.map((obj) => ({...obj, owner: '67f9dfa170dad22a21c7dc4e'}));
    await Listing.insertMany(initData.data);
    console.log('Data was initialized');
}

initDB();