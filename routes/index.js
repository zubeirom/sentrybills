/* eslint-disable no-underscore-dangle */
const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt-nodejs');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const JSONAPIError = require('jsonapi-serializer').Error;


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
        'bills',
    ],
});


const User = require('../models/User');

let currentUser;

router.post('/token', asyncHandler(async (req, res, next) => {
    if (req.body.grant_type === 'password') {
        try {
            const { username, password } = req.body;
            await User.find({ email: username }, async (err, docs) => {
                if (docs.length !== 0) {
                    if (docs[0].password === password) {
                        currentUser = docs[0]._id;
                        res.status(200).send('{ "access_token": "secret token"}');
                        next();
                    } else {
                        bcrypt.compare(password, docs[0].password, (error, val) => {
                            if (error) {
                                next(error);
                            }
                            if (val) {
                                res.status(200).send('{ "access_token": "secret token"}');
                                next();
                            } else {
                                res.status(400).send('{"error": "invalid_grant"}');
                                next();
                            }
                        });
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
    new JSONAPIDeserializer().deserialize(req.body, async (err, user) => {
        try {
            const { email } = user;
            let { password } = user;

            const findUser = await User.find({ email });

            console.log(findUser);

            if (findUser.length > 0) {
                res.status(409).send(ResFoundErr);
                next();
            } else {
                bcrypt.genSalt(10, (e, salt) => {
                    if (e) {
                        console.log(e);
                    }
                    bcrypt.hash(password, salt, null, async (error, hash) => {
                        if (error) {
                            next(error);
                        }
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
                    });
                });
            }
        } catch (error) {
            next(error);
        }
    });
}));

router.get('/bills', asyncHandler(async (req, res, next) => {
    try {
        
    } catch (error) {
        next(error);
    }

}))


module.exports = router;
