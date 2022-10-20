const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const bcrypt = require("bcrypt");
const { HTTP_CODES, ROLES, STATUS } = require("../consts/constants");
const User = require("../models/user");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  let users;

  try {
    users = await User.find({}, { password: 0 }).populate("managerId", [
      "-password",
    ]);
  } catch (error) {
    console.log(error);
    return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: "Server Error" });
  }

  return res.status(HTTP_CODES.SUCCESS).json({ users });
});

router.get("/manager/:managerId", auth, async (req, res) => {
  const managerId = req.params["managerId"];

  // check active user role. only admin and manager can check manager's subordinates
  const role = req.user.role;

  if (!(role == ROLES.ADMINISTRATOR || role == ROLES.MANAGER)) {
    return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
  }

  // MAKE SURE MANAGER REQUESTING = MANAGER IN PATH
  if (role == ROLES.MANAGER) {
    if (req.user.id !== managerId) {
      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }
  }

  let users;

  try {
    users = await User.find({ managerId });
  } catch (error) {
    return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: "Server Error" });
  }

  res.status(HTTP_CODES.SUCCESS).json({ users });
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
          .json({
            msg: "Bad request",
            errors: [
              {
                msg: `User with id ${userId} exists try logging in instead`,
                param: "userId",
              },
            ],
          });
      }
    } catch (error) {
      console.log(error);
      return res
        .status(HTTP_CODES.SERVER_ERROR)
        .json({ msg: "Something went wrong please try again" });
    }

    // check if manager is valid
    if (managerId) {
      try {
        const manager = await User.findById(managerId);
        if (!manager || manager.role !== ROLES.MANAGER) {
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
      dateJoined: Date.now(),
    });

    try {
      user.save();

      user = { ...user._doc };

      delete user.password;
    } catch (error) {
      console.log(error);
    }

    // return user
    res.status(HTTP_CODES.SUCCESS).json({ user });
  }
);

router.put(
  "/activate/:userId",
  auth,
  body("status", "status is required").not().isEmpty(),
  async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      res
        .status(HTTP_CODES.BAD_REQUEST)
        .json({ msg: "Bad request", errors: errors.errors });
    }

    const role = req.user.role;

    // only manager or admin can activate a user
    if (!(role == ROLES.ADMINISTRATOR || role == ROLES.MANAGER)) {
      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }

    const { status } = req.body;

    const userId = req.params["userId"];

    if (status !== 1) {
      errors = [{ param: "status", msg: "Invalid status" }];

      return res
        .status(HTTP_CODES.BAD_REQUEST)
        .json({ msg: "Bad request", errors });
    }

    let user;

    try {
      // check if user to activate is a valid user
      user = await User.findById({ _id: userId });

      if (!user) {
        return res
          .status(HTTP_CODES.BAD_REQUEST)
          .json({ msg: "User Does not exist" });
      }
    } catch (error) {
      console.log(error);
      return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: "Server Error" });
    }

    // only admin can activate manager
    if (
      (req.user.role == ROLES.MANAGER && user.role == ROLES.MANAGER) ||
      (req.user.role == ROLES.MANAGER && user.role == ROLES.ADMINISTRATOR)
    ) {
      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }

    // VERIFY THE MANAGER HAS RIGHT TO ACTIVATE SUBORDINATE
    if (
      role == ROLES.MANAGER &&
      user.managerId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }

    try {
      user.status = status;

      user.dateActive = Date.now();

      user.save();
    } catch (error) {
      return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: "Server Error" });
    }

    return res.status(HTTP_CODES.SUCCESS).json({ msg: "Activated Ok" });
  }
);

router.put(
  "/change-role/:userId",
  auth,
  body("role", "Role is required").not().isEmpty(),
  async (req, res) => {
    /**
     * validate request body parameter
     * ensure active user's role is sufficient for task
     * if active user is developer - return forbiden
     * if user is manager and active user is also manahger return forbiden
     * ensure role supplied in body is a valid role
     * get userid from params
     * ensure user is a valid user
     * update user status
     *
     */

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res
        .status(HTTP_CODES.BAD_REQUEST)
        .json({ msg: "Bad Request", errors: { ...errors.errors } });
    }

    const { role } = req.body;
    const _id = req.params["userId"];

    if (
      role !== ROLES.ADMINISTRATOR &&
      role !== ROLES.MANAGER &&
      role !== ROLES.DEVELOPER
    ) {
      // INVALID ROLE
      return res.status(HTTP_CODES.BAD_REQUEST).json({
        msg: "Bad Request",
        errors: [{ msg: "Invalid role", param: "role" }],
      });
    }

    if (req.user.role == ROLES.DEVELOPER) {
      res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }

    // get user so we can ascertain his manager and if this manager has right to change his role
    let user;

    try {
      user = await User.findById({ _id });

      if (!user) {
        return res.status(HTTP_CODES.BAD_REQUEST).json({
          msg: "Bad Request",
          errors: [{ msg: "User does not exist", param: "role" }],
        });
      }
    } catch (error) {
      return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: "Server Error" });
    }

    if (req.user.id == _id) {
      // shouldnt get here, but if it does for any reason - user can't update self
      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }

    if (user.managerId.toString() !== req.user._id.toString()) {
      // MANAGER CAN ONLY CHANGE ROLE OF SUBORDINATE
      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }

    if (user.role == ROLES.MANAGER && req.user.role !== ROLES.ADMINISTRATOR) {
      // ONLY AN ADMIN CAN CHANGE MANAGER ROLE
      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }

    user.role = role;

    try {
      await user.save();
    } catch (error) {
      return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: "Server Error" });
    }

    return res.status(HTTP_CODES.SUCCESS).json({ msg: "Status updated ok" });
  }
);

router.delete(
  "/delete/:userId",
  auth,
  [body("status", "Status is requied").not().isEmpty()],
  async (req, res) => {

    const _id = req.params['userId'];

    const errors = validationResult(req);

    if (!errors.isEmpty()){

      return res.status(HTTP_CODES.BAD_REQUEST).json({ msg: 'Bad request', errors: errors.errors})

    }

    const {status} = req.body;
    
    // only admin can delete a user
    if (req.user.role !== ROLES.ADMINISTRATOR){

      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: 'Forbidden' });

    }

    if (status != -1){

      const errors = [{ msg: `Invalid status`, param: 'status'}];

      return res.status(HTTP_CODES.BAD_REQUEST).json({ msg: 'Bad request', errors })

    }

    let user;
    
    try {

      user = await User.findById({_id});

      if(!user){
        
        const errors = [{ msg: `User with id: ${_id} does not exist `, param: 'userId'}];

        return res.status(HTTP_CODES.BAD_REQUEST).json({ msg: 'Bad request', errors })
      }

      if (req.user.id == _id){

        const errors = [{ msg: `Can't delete self `, param: 'userId'}];

        return res.status(HTTP_CODES.BAD_REQUEST).json({ msg: 'Bad request', errors })
      }
    } catch (error) {
      console.log(error)
      return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: 'Server Error'})
    }

    user.status = status;

    user.save();

    return res.status(HTTP_CODES.SUCCESS).json({ msg: "User deleted ok" });
  }

  
);

module.exports = router;
