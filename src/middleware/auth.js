const jwt = require("jsonwebtoken");
const { getDb } = require("../models/db");

const JWT_SECRET = process.env.JWT_SECRET || "finance_secret_key_2026";

// checks if the request has a valid token and loads that user into req.user
// every protected route uses this before doing anything else
function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = getDb();

    // fetch the user fresh from DB each time so we catch status changes (e.g. deactivated)
    const user = db
      .prepare("SELECT id, name, email, role, status FROM users WHERE id = ?")
      .get(payload.userId);

    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.status === "inactive")
      return res.status(403).json({ error: "Account is inactive" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// used on routes where only specific roles are allowed
// e.g. authorize("admin") or authorize("admin", "analyst")
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
    }
    next();
  };
}

// generates a JWT token for the given user id, valid for 8 hours
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "8h" });
}

module.exports = { authenticate, authorize, signToken };
