import express from "express";
import bodyParser from "body-parser";
import { router as game } from "./api/game";
export const app = express();
app.use(bodyParser.json());
app.use("/game",game);
