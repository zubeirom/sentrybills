const express = require('express');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt-nodejs');


const router = express.Router();

router.post('/token', asyncHandler(async (req, res, next) => {
  if (req.body.grant_type === 'password') {
    try {
      const { username, password } = req.body;
      await User.find({ email: username }, async (err, docs) => {
        if (docs.length !== 0) {
          const findPerson = await Person.find({ email: username });

          if (findPerson.length !== 0) {
            currentUser = username;
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

module.exports = router;
