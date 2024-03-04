import express from "express";
import bodyParser from "body-parser";
import { router as game } from "./api/game";
import { router as upload } from "./api/upload";
import cors from "cors";

export const app = express();

app.use(
    cors({
      origin: "*",
    })
  );
app.use(bodyParser.json());
app.use("/game",game);
app.use("/upload", upload);
app.use("/uploads", express.static("uploads"));
