const express = require('express');
const asyncHandler = require('express-async-handler');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const JSONAPIError = require('jsonapi-serializer').Error;
const mongoose = require('mongoose');


const router = express.Router();

const BillSerializer = new JSONAPISerializer('Bill', {
    attributes: [
        'name',
        'total',
        'due',
        'note',
        'balanced',
        'addToCal',
        'userId',
    ],
});

const Bill = require('../models/Bill');

router.get('/', asyncHandler(async (req, res, next) => {
    try {
        const { userId } = req.query;
        const id = mongoose.Types.ObjectId(userId);
        const findBills = await Bill.find({ userId: id });
        const billsJson = BillSerializer.serialize(findBills);
        res.status(200).send(billsJson);
        next();
    } catch (error) {
        next(error);
    }
}));

module.exports = router;
