import express from "express";
import bodyParser from "body-parser";
import { router as game } from "./api/game";
import { router as upload } from "./api/upload";

export const app = express();
app.use(bodyParser.json());
app.use("/game",game);
app.use("/upload", upload);
app.use("/uploads", express.static("uploads"));
