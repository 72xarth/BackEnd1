import express from "express";
import mysql from "mysql";
import bcrypt from "bcrypt"; // Import bcrypt for password hashing
import { conn } from "../dbconnect";
import { GamePostRequest } from "../model/game_post_req";

const saltRounds = 10; // Number of salt rounds for bcrypt

export const router = express.Router();

// Retrieve all users
router.get("/", (req, res) => {
  conn.query("SELECT * FROM Gameless", (err, result, fields) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

// Retrieve user by ID
router.get("/id/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Gameless WHERE uid = ?";
  conn.query(sql, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

// Random Picture
router.get("/picture", (req, res) => {
  const sql = "SELECT * FROM Game_Picture ORDER BY RAND() LIMIT 2;";
  conn.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

// Test endpoint for password comparison
router.post("/test", (req, res) => {
  const gmail = req.body.gmail;
  const password = req.body.password;
  console.log();

  const sql = "SELECT * FROM Gameless WHERE gmail = ?";
  conn.query(sql, [gmail], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      if (result.length > 0) {
        const storedPassword = result[0].password;
        if (comparePassword(password, storedPassword)) {
          res.json({ uid: result[0].uid, name: result[0].name });
        } else {
          res.status(401).json({ error: "Wrong password" });
        }
      } else {
        res.status(404).json({ error: "Monsoyet" });
      }
    }
  });
});
// ฟังก์ชันสำหรับ hash รหัสผ่าน
const hashPassword = (password: any) => {
  return bcrypt.hashSync(password, saltRounds);
};

// ฟังก์ชันสำหรับเปรียบเทียบรหัสผ่าน
const comparePassword = (password: any, hashedPassword: any) => {
  return bcrypt.compareSync(password, hashedPassword);
};

router.post("/game/insert", (req, res) => {
  //receive data
  let game: GamePostRequest = req.body;
  console.log(req.body);

  // เรียกใช้งานฟังก์ชัน hashPassword เพื่อ hash รหัสผ่าน
  const password = game.password;
  const hashedPassword = hashPassword(password);
  console.log("Hashed password:", hashedPassword);
  //Updata to database
  let sql =
    "INSERT INTO `Gameless`(`name`, `gmail`, `password`) VALUES (?,?,?)";
  sql = mysql.format(sql, [game.name, game.gmail, hashedPassword]);
  //request data
  conn.query(sql, (err, result) => {
    if (err) throw err;
    res.status(200).json({ affected_row: result.affectedRows });
  });
});

//point update

router.put("/scoreupdate", (req, res) => {
  const data = req.body;
  console.log(data);

  let scoreA;
  let scoreB;
  let ra = 1 / (1 + Math.pow(10, (data.scoreB - data.scoreA) / 400));
  let rb = 1 / (1 + Math.pow(10, (data.scoreA - data.scoreB) / 400));

  if (data.win == "A") {
    scoreA = data.scoreA + 32 * (1 - ra);
    scoreB = data.scoreB + 32 * (0 - rb);
  } else if (data.win == "B") {
    scoreA = data.scoreA + 32 * (0 - ra);
    scoreB = data.scoreB + 32 * (1 - rb);
  }

  if (scoreA <= 0) {
    scoreA = 0;
  }

  if (scoreB <= 0) {
    scoreB = 0;
  }

  let sql1 = "update Game_Picture set score = ?  where gid = ?";
  let sql2 = "update Game_Picture set score = ?  where gid = ?";
  sql1 = mysql.format(sql1, [scoreA, data.gidA]);

  sql2 = mysql.format(sql2, [scoreB, data.gidB]);

  let query1 = new Promise((resolve, reject) => {
    conn.query(sql1, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });

  let query2 = new Promise((resolve, reject) => {
    conn.query(sql2, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });

  Promise.all([query1, query2])
    .then((results) => {
      res.status(200).json(results);
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});
