import express from "express"
import dotenv from "dotenv"
import { startConsumer } from "./startConsumer.js";

dotenv.config();

startConsumer();

const app = express();
const PORT = process.env.PORT || 3001;


app.listen(PORT, () => {
    console.log(`Service-2 is running on port ${PORT}`);
});
