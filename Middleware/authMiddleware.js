const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Get the token from the 'Authorization' header
  const authHeader = req.header('Authorization');

  // Check if no header or if the header is not in the correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Extract the token value from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Attach the user ID from the token payload to the request object
    req.user = decoded.userId;

    // Call the next middleware or route handler
    next();
  } catch (e) {
    // If the token is invalid, send a 401 Unauthorized response
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;