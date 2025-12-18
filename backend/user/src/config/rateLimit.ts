import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});