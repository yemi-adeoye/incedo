const express = require("express");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const path = require("path");

const scriptName = path.basename(__filename);
const bcrypt = require("bcrypt");
const { HTTP_CODES, ROLES, STATUS } = require("../consts/constants");
const User = require("../models/user");
const Report = require("../models/report");

router.get("/", async (req, res) => {
  let users;
  try {
    users = await User.find().populate(['reports', 'managerId']);
    
  } catch (error) {
    console.log(error)
  }
  res.send(users)
  //res.status(HTTP_CODES.SUCCESS).json({ users });
});

/**
 * @path: api/v1/users/
 * @params: none
 * @requestBody: {
 *  fullname: String,
 *  userId: String,
 *  password: String,
 *  role: String,
 *  managerId: String,
 * }
 */
router.post(
  "/",
  [
    body("fullname", "User name is requires").not().isEmpty(),
    body("userId", "User name is requires").not().isEmpty(),
    body("role", "User name is requires").not().isEmpty(),
    body("password", "User name is requires").not().isEmpty(),
  ],
  async (req, res) => {
    // get validation errors
    const errors = validationResult(req);

    // return bad request message if errors exist
    if (!errors.isEmpty()) {
      return res
        .status(HTTP_CODES.BAD_REQUEST)
        .json({ msg: "Bad request", errors: errors.array() });
    }

    let { fullname, userId, role, managerId, password } = req.body;

    // check if user with id does not already exist
    try {
      const user = await User.findOne({ userId });

      if (user) {
        return res
          .status(HTTP_CODES.BAD_REQUEST)
          .json({ msg: "User exists try logging in instead" });
      }
    } catch (error) {
      console.log(error)
      return res
        .status(HTTP_CODES.SERVER_ERROR)
        .json({ msg: "Something went wrong please try again" });
    }

    // check if manager is valid
    if (managerId) {
      try {
        const manager = await User.findById(managerId);
        if (!manager){
          return res
          .status(HTTP_CODES.BAD_REQUEST)
          .json({ msg: "Invalid Manager" });
        }
      } catch (error) {
        return res
        .status(HTTP_CODES.SERVER_ERROR)
        .json({ msg: "Something went wrong please try again" });
      }
      
    } else {
      managerId = null;
    }

    role = role.toUpperCase();

    // invalid role
    if (
      !role == ROLES.DEVELOPER ||
      role == ROLES.MANAGER ||
      role == ROLES.ADMINISTRATOR
    ) {
      return res.status(HTTP_CODES.BAD_REQUEST).json({ msg: "Bad request" });
    }

    // handle password hashing
    try {
      const SALT_ROUNDS = 10;

      const SALT = await bcrypt.genSalt(SALT_ROUNDS);

      password = await bcrypt.hash(password, SALT);
    } catch (error) {
      console.log(error);
      return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: "Server Error" });
    }
    console.log(User);
    let user = new User({
      fullname,
      userId,
      password,
      role,
      status: STATUS.INACTIVE,
      managerId,
    });

    try {
      user.save();
    } catch (error) {
      console.log(error);
    }

    // return user
    res.status(HTTP_CODES.SUCCESS).json({ user });
  }
);

module.exports = router;
