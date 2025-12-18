import dotenv from "dotenv";

dotenv.config();

export const ENV = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000", //ideally your frontend url
    MONGODB_URL: process.env.MONGODB_URL,
    SECRET_KEY: process.env.SECRET_KEY
}