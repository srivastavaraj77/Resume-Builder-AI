import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "UNAUTHORIZED", "Missing or invalid bearer token"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (_error) {
    return next(new ApiError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
};

export default protect;
