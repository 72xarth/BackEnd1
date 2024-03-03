import express from "express";
import bodyParser from "body-parser";
import { router as game } from "./api/game";
import cors from "cors";
export const app = express();

app.use(
    cors({
      origin: "*",
    })
  );
app.use(bodyParser.json());
app.use("/game",game);
