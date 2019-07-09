/* eslint-disable consistent-return */
const express = require('express');
const asyncHandler = require('express-async-handler');
const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
const JSONAPISerializer = require('jsonapi-serializer').Serializer;
const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

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
        'authUrl',
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

            let authorize;
            let getAccessToken;
            let createEvent;

            /* GOOGLE CALENDAR */
            if (addToCal) {
                // If modifying these scopes, delete token.json.
                const SCOPES = ['https://www.googleapis.com/auth/calendar'];
                // The file token.json stores the user's access and refresh tokens, and is
                // created automatically when the authorization flow completes for the first
                // time.
                const TOKEN_PATH = 'token.json';

                // Load client secrets from a local file.
                fs.readFile('./credentials.json', (error, content) => {
                    if (error) return console.log('Error loading client secret file:', error);
                    // Authorize a client with credentials, then call the Google Calendar API.
                    authorize(JSON.parse(content));
                });

                /**
                * Create an OAuth2 client with the given credentials, and then execute the
                * given callback function.
                * @param {Object} credentials The authorization client credentials.
                * @param {function} callback The callback to call with the authorized client.
                */
                authorize = (credentials, callback) => {
                    // eslint-disable-next-line camelcase
                    const { client_secret, client_id, redirect_uris } = credentials.web;
                    const oAuth2Client = new google.auth.OAuth2(
                        client_id, client_secret, redirect_uris[0],
                    );

                    // Check if we have previously stored a token.
                    fs.readFile(TOKEN_PATH, (err1, token) => {
                        if (err1) return getAccessToken(oAuth2Client, callback);
                        oAuth2Client.setCredentials(JSON.parse(token));
                        callback(oAuth2Client);
                    });
                };
                /**
                * Get and store new token after prompting for user authorization, and then
                * execute the given callback with the authorized OAuth2 client.
                * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
                * @param {getEventsCallback} callback The callback for the authorized client.
                */
                getAccessToken = (oAuth2Client, callback) => {
                    const authUrl = oAuth2Client.generateAuthUrl({
                        access_type: 'offline',
                        scope: SCOPES,
                    });
                    console.log('Authorize this app by visiting this url:', authUrl);
                    const rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });
                    rl.question('Enter the code from that page here: ', (code) => {
                        rl.close();
                        oAuth2Client.getToken(code, (err2, token) => {
                            if (err2) return console.error('Error retrieving access token', err);
                            oAuth2Client.setCredentials(token);
                            // Store the token to disk for later program executions
                            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (e) => {
                                if (e) return console.error(e);
                                console.log('Token stored to', TOKEN_PATH);
                            });
                            callback(oAuth2Client);
                        });
                    });
                };

                // Refer to the Node.js quickstart on how to setup the environment:
                // https://developers.google.com/calendar/quickstart/node
                // Change the scope to 'https://www.googleapis.com/auth/calendar' and delete any
                // stored credentials.

                createEvent = (auth) => {
                    const calendar = google.calendar({ version: 'v3', auth });
                    const event = {
                        summary: 'Google I/O 2015',
                        location: '800 Howard St., San Francisco, CA 94103',
                        description: 'A chance to hear more about Google\'s developer products.',
                        start: {
                            dateTime: '2019-07-10T09:00:00-07:00',
                            timeZone: 'America/Los_Angeles',
                        },
                        end: {
                            dateTime: '2015-05-28T17:00:00-07:00',
                            timeZone: 'America/Los_Angeles',
                        },
                        recurrence: [
                            'RRULE:FREQ=DAILY;COUNT=2',
                        ],
                        attendees: [
                            { email: 'lpage@example.com' },
                            { email: 'sbrin@example.com' },
                        ],
                        reminders: {
                            useDefault: false,
                            overrides: [
                                { method: 'email', minutes: 24 * 60 },
                                { method: 'popup', minutes: 10 },
                            ],
                        },
                    };
                    calendar.events.insert({
                        auth,
                        calendarId: 'primary',
                        resource: event,
                    }, (err3, eventlog) => {
                        if (err) {
                            console.log(`There was an error contacting the Calendar service: ${err3}`);
                            return;
                        }
                        console.log('Event created: %s', eventlog.htmlLink);
                    });
                };
            }
            /* END */

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
