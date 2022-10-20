const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const { HTTP_CODES, ROLES, STATUS } = require("../consts/constants");
const User = require("../models/user");
const Project = require("../models/project");
const auth = require("../middleware/auth");
const project = require("../models/project");
const router = express.Router();

router.post(
  "/",
  [
    body("projectName", "Project name is required").not().isEmpty(),
    body("sapId", "Project SAP ID is required").not().isEmpty(),
    body("from", "Start date is required").isDate(),
    body("to", "End date is required").isDate(),
    body(
      "transportAllowance",
      "Transport allowance name is required"
    ).isNumeric(),
  ],
  auth,
  async (req, res) => {
    if (req.user.role !== ROLES.ADMINISTRATOR) {
      return res.status(HTTP_CODES.FORBIDDEN).json({ msg: "Forbidden" });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res
        .status(HTTP_CODES.BAD_REQUEST)
        .json({ msg: "Bad request", errors: errors.errors });
    }

    const { projectName, sapId, from, to, transportAllowance } = req.body;

    // check that project with sapId doesnt exist
    let existingProject;
    try {
      existingProject = await Project.findOne({ sapId });

      if (existingProject) {
        const errors = [
          { param: "sapId", msg: `Project exists with the id: ${sapId}` },
        ];

        return res
          .status(HTTP_CODES.BAD_REQUEST)
          .json({ msg: "Bad request", errors });
      }
    } catch (error) {}
    let project;

    try {
      project = new Project({ ...req.body });

      await project.save();
    } catch (error) {
      return res.send("Server Error");
    }

    return res.status(HTTP_CODES.SUCCESS).json({ project });
  }
);

router.get("/:projectId", auth, async (req, res) => {
  const _id = req.params["projectId"];
    
  if (_id.length !== 24) {
    const errors = [{ msg: "Invalid project id", param: "projectId" }];
    return res
      .status(HTTP_CODES.BAD_REQUEST)
      .json({ msg: "Bad request", errors });
  }

  let project;

  try {

    project = await Project.findById({ _id });

    if (!project) {

      return res.status(HTTP_CODES.BAD_REQUEST).json({ msg: "Bad request" });

    }

  } catch (error) {

    return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: "Server Error" });

  }

  return res.status(HTTP_CODES.SUCCESS).json({ project });

});

router.get("/", auth, async (req, res) => {
    
    let projects;

    try {

        projects = await Project.find({}).populate('reports');

    } catch (error) {
        console.log(error)
        return res.status(HTTP_CODES.SERVER_ERROR).json({ msg: 'Server Error'});
    }

    res.status(HTTP_CODES.SUCCESS).json({ projects })
});

module.exports = router;
