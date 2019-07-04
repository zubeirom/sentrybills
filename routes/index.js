/* eslint-disable no-underscore-dangle */
const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const JSONAPIError = require('jsonapi-serializer').Error;
const mongoose = require('mongoose');

const router = express.Router();

const ResFoundErr = new JSONAPIError({
    code: '409',
    title: 'Email exists already',
    detail: 'Please use different Email',
});

const UserSerializer = new JSONAPISerializer('User', {
    attributes: [
        'email',
        'password',
    ],
});

const User = require('../models/User');


router.post('/token', asyncHandler(async (req, res, next) => {
    if (req.body.grant_type === 'password') {
        try {
            const { username, password } = req.body;
            await User.find({ email: username }, async (e, docs) => {
                if (docs.length !== 0) {
                    if (docs[0].password === password) {
                        res.status(200).send(`{ "access_token": "${docs[0]._id}"}`);
                        next();
                    } else {
                        const hash = docs[0].password;
                        const val = bcrypt.compareSync(password, hash);
                        if (val) {
                            res.status(200).send(`{ "access_token": "${docs[0]._id}" }`);
                            next();
                        } else {
                            res.status(400).send('{"error": "invalid_grant"}');
                            next();
                        }
                    }
                } else {
                    res.status(400).send('{"error": "invalid_grant"}');
                    next();
                }
            });
        } catch (error) {
            next(error);
        }
    } else {
        res.status(400).send('{ "error": "unsupported_grant_type" }');
    }
}));

router.post('/users', asyncHandler(async (req, res, next) => {
    try {
        new JSONAPIDeserializer().deserialize(req.body, async (err, user) => {
            const { email } = user;
            let { password } = user;

            const findUser = await User.find({ email });

            if (findUser.length > 0) {
                res.status(409).send(ResFoundErr);
                next();
            } else {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(password, salt);
                password = hash;

                const newUser = new User({
                    email,
                    password,
                });

                const saveUser = await newUser.save();

                if (saveUser) {
                    const UserJson = UserSerializer.serialize(saveUser);
                    res.status(200).json(UserJson);
                    next();
                }
            }
        });
    } catch (error) {
        next(error);
    }
}));

router.get('/users', asyncHandler(async (req, res, next) => {
    try {
        const id = mongoose.Types.ObjectId(req.query.id);
        const bill = await User.findById(id);
        const billsJson = UserSerializer.serialize(bill);
        res.status(200).send(billsJson);
        next();
    } catch (error) {
        next(error);
    }
}));

// DELETE /USER
router.delete('/users/:id', asyncHandler(async (req, res, next) => {
    try {
        const id = mongoose.Types.ObjectId(req.params.id);
        await User.deleteOne({ _id: id });
        res.status(204).send({});
        next();
    } catch (error) {
        next(error);
    }
}));

module.exports = router;
