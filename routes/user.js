const express = require('express');
const router = express.Router();
var path = require('path');
var scriptName = path.basename(__filename);

router.get('/', (req, res) => {
    res.send(`hello from ${scriptName}`);
})

module.exports = router