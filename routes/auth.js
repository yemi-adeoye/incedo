const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const { HTTP_CODES } = require("../consts/constants");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const config = require('config');
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => {
    console.log(req.user)
  res.status(HTTP_CODES.SUCCESS).json({ msg: true })
});

/**
 * @path: api/v1/auth/
 * @params: none
 * @requestBody: {
 *  id: String,
 *  password: String,
 *  managerId: String,
 * }
 * @return: token object
 */
router.post("/", [
  body("userId", "userID is required").not().isEmpty(),
  body("password", "password is required").not().isEmpty(),
], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()){
        res.status(HTTP_CODES.BAD_REQUEST).json({ msg: 'Bad request'})
    }

    /**
     * receive credentials
     * find user by user id
     * compare passwords
     * if okay token user_id and send
     * else send bad error request
     */

    // receive credentials
    const { userId, password } = req.body;

    // fetch user by userID
    let user;

    try {
        user = await User.findOne({userId});

        if (!user){
            return res.status(HTTP_CODES.BAD_REQUEST).json({ msg: 'Bad request'});
        }

    } catch (error) {
        console.log(error)
        return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: 'Server Error'})
    }

    const isSame = await bcrypt.compare(password, user.password);

    if (!isSame){
        return res.status(HTTP_CODES.BAD_REQUEST).json({ msg: 'Bad request'});
    }

    const payload = {_id: user.id }
    console.log(config)
    const JWT_SECRET = config.get('jwtSecret');

    

    const token = await jwt.sign(payload, JWT_SECRET)

    res.status(HTTP_CODES.SUCCESS).json({ token});
});

module.exports = router;
