const jwt = require("jsonwebtoken");
const config = require('config');
const { HTTP_CODES } = require("../consts/constants");

module.exports = async (req, res, next) => {

    /**
     * get token
     * if token is not valid send bad request rsponse
     * verify token
     * if token is expired send bad request response
     * if token is valid call next function
     */
    const token = req.headers['x-auth-token'];

    if (!token){

        return res.status(HTTP_CODES.UNAUTHORIZED).json({msg: 'Unauthorized'})
    }

    const JWT_SECRET = config.get('jwtSecret')

    try {
        const {_id} = await jwt.verify(token, JWT_SECRET);
        
        const user = await User.findById({ _id });

        if (!user){
            return res.status(HTTP_CODES.UNAUTHORIZED).json({msg: 'Unauthorized'})
        }
        
        req.user = user;

    } catch (error) {
        return res.status(HTTP_CODES.SERVER_ERROR).json({msg: 'server Error'})
    }
    
    next();
}