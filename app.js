const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');


/** This will prevent heroku from putting app on sleepmode  */
setInterval(() => {
    http.get('https://sentrybills.herokuapp.com/bills');
}, 300000);

const app = express();

// Bodyparser
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// cors
app.use(cors());

// DB
mongoose.connect('mongodb+srv://zubeirtech:sLPB6V66P4s8tkNb@zubeirtechdb-jcizl.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

// Routes
app.use('/', require('./routes/index'));
app.use('/bills', require('./routes/bills'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
