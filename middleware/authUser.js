const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_key";

const authenticateUser = (req, res, next) => {
  try {
    console.log('🔍 Auth middleware - Headers:', req.headers);
    
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({ 
        success: false,
        message: "Access denied. No token provided." 
      });
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer TOKEN"
    console.log('🔍 Extracted token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      console.log('❌ No token in header');
      return res.status(401).json({ 
        success: false,
        message: "Access denied. Invalid token format." 
      });
    }

    console.log('🔍 JWT_SECRET being used:', JWT_SECRET.substring(0, 10) + '...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decoded successfully:', decoded);
    
    req.user = decoded; // Contains: { id, name, role }
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token." 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired." 
      });
    } else {
      return res.status(401).json({ 
        success: false,
        message: "Token verification failed." 
      });
    }
  }
};

module.exports = authenticateUser;