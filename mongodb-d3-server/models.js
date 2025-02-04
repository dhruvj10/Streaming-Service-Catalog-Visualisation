// models.js
const mongoose = require('mongoose');

const netflixSchema = new mongoose.Schema({}, { strict: false, collection: 'Netflix' });
const huluSchema = new mongoose.Schema({}, { strict: false, collection: 'Hulu' });
const amazonPrimeSchema = new mongoose.Schema({}, { strict: false, collection: 'Amazon_Prime' });
const disneySchema = new mongoose.Schema({}, { strict: false, collection: 'Disney+' });

const Netflix = mongoose.model('Netflix', netflixSchema);
const Hulu = mongoose.model('Hulu', huluSchema);
const AmazonPrime = mongoose.model('Amazon_Prime', amazonPrimeSchema);
const Disney = mongoose.model('Disney+', disneySchema);

module.exports = { Netflix, Hulu, AmazonPrime, Disney };