const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, token missing" });
  }

  try {
    // SECURITY: doesn't check the database, so deactivated users/demoted admins keep access until the token expires
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // NOTE: comment is outdated; the token contains { id, role, email }
    req.user = decoded; // Attaches { id: userId } to req.user
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token verification failed" });
  }
};
