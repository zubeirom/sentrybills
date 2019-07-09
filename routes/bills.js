/* eslint-disable consistent-return */
const express = require('express');
const asyncHandler = require('express-async-handler');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
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
        if (req.query.name) {
            const { name, userId } = req.query;
            const findBills = await Bill.find({ userId });
            const filteredBills = [];
            findBills.forEach((bill) => {
                const n = bill.name;
                const nl = n.toLowerCase();
                if (nl.includes(name)) {
                    filteredBills.push(bill);
                }
            });

            const billsJson = BillSerializer.serialize(filteredBills);
            res.status(200).send(billsJson);
            next();
        } else {
            const { userId } = req.query;
            const id = mongoose.Types.ObjectId(userId);
            const findBills = await Bill.find({ userId: id });
            const billsJson = BillSerializer.serialize(findBills);
            res.status(200).send(billsJson);
            next();
        }
    } catch (error) {
        next(error);
    }
}));

router.get('/:id', asyncHandler(async (req, res, next) => {
    try {
        const bill = await Bill.findById(req.params.id);
        const billsJson = BillSerializer.serialize(bill);
        res.status(200).send(billsJson);
        next();
    } catch (error) {
        next(error);
    }
}));

router.patch('/:id', asyncHandler(async (req, res, next) => {
    try {
        new JSONAPIDeserializer({
            keyForAttribute: 'camelCase',
        }).deserialize(req.body, async (err, bill) => {
            const {
                name, total, due, note, addToCal, balanced,
            } = bill;
            const findBill = await Bill.findById(req.params.id);
            findBill.balanced = balanced;
            findBill.name = name;
            findBill.total = total;
            findBill.due = due;
            findBill.note = note;
            findBill.addToCal = addToCal;
            await findBill.save();
            const billsJson = BillSerializer.serialize(findBill);
            res.status(200).send(billsJson);
            next();
        });
    } catch (error) {
        next(error);
    }
}));

router.delete('/:id', asyncHandler(async (req, res, next) => {
    try {
        await Bill.deleteOne({ _id: req.params.id });
        res.status(204).send({});
        next();
    } catch (error) {
        next(error);
    }
}));

router.post('/new', asyncHandler((req, res, next) => {
    try {
        new JSONAPIDeserializer({
            keyForAttribute: 'camelCase',
        }).deserialize(req.body, async (err, bill) => {
            const {
                name, total, due, note, addToCal, balanced, userId,
            } = bill;

            const newBill = new Bill({
                name, total, due, note, addToCal, balanced, userId,
            });

            const saveBill = await newBill.save();

            const billJson = BillSerializer.serialize(saveBill);
            res.status(200).send(billJson);
            next();
        });
    } catch (error) {
        next(error);
    }
}));

module.exports = router;
