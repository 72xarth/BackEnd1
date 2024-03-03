import express from "express";
import mysql from "mysql";
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import { conn } from "../dbconnect";
import { GamePostRequest } from "../model/game_post_req";

const saltRounds = 10; // Number of salt rounds for bcrypt

export const router = express.Router();

// Retrieve all users
router.get("/", (req, res) => {
    conn.query('SELECT * FROM Gameless', (err, result, fields) => {
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

// Test endpoint for password comparison
router.get("/test", (req, res) => {
    const gmail = req.query.gmail;
    const password = req.query.password;

    const sql = 'SELECT password FROM Gameless WHERE gmail = ?';
    conn.query(sql, [gmail], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            if (result.length > 0) {
                const storedPassword = result[0].password;
                if (comparePassword(password, storedPassword)) {
                    res.json({ message: "Success" });
                } else {
                    res.status(401).json({ error: "Wrong password" });
                }
            } else {
                res.status(404).json({ error: "User not found" });
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





router.post("/game/insert",  (req, res) => {
    
    //receive data
    let game: GamePostRequest = req.body;
  console.log(req.body);
  
    // เรียกใช้งานฟังก์ชัน hashPassword เพื่อ hash รหัสผ่าน
    const password = game.password;
    const hashedPassword = hashPassword(password);
    console.log('Hashed password:', hashedPassword);
    //Updata to database
    let sql = "INSERT INTO `Gameless`(`name`, `gmail`, `password`) VALUES (?,?,?)";
    sql = mysql.format(sql, [
        game.name,
        game.gmail,
        hashedPassword

    ]);
    //request data
    conn.query(sql, (err, result) => {
        if (err) throw err;
        res.status(200).json
            ({ affected_row: result.affectedRows });
    });

    res.status(200).json(game);
});



export default router;
