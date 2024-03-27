import express from "express";
import mysql from "mysql";
import bcrypt from "bcrypt"; // Import bcrypt for password hashing
import { conn } from "../dbconnect";
import { GamePostRequest } from "../model/game_post_req";
import multer from "multer";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const saltRounds = 10; // Number of salt rounds for bcrypt

export const router = express.Router();

const firebaseConfig = {
  apiKey: "AIzaSyCJV56JCebsYq_omskDpXT6MEXhuLCbRo4",
  authDomain: "project01-69142.firebaseapp.com",
  projectId: "project01-69142",
  storageBucket: "project01-69142.appspot.com",
  messagingSenderId: "985064760337",
  appId: "1:985064760337:web:586f2b27a8d653c0c5fdb0",
  measurementId: "G-0QE6YDDGGH"
};

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



/*// Random Picture
router.get("/picture", (req, res) => {
  console.log("sss");

  const sql = "SELECT * FROM Game_Picture JOIN state ON Game_Picture.gid = state.GSID ORDER BY RAND() LIMIT 2";
  
  conn.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});*/

router.get("/picture/:gid", (req, res) => {
  const id = req.params.gid;
  let delayedData: any[] | null = null; // Variable to store delayed data
  let delayFinished = false; // Variable to track if delay has finished

  // Function to send delayed response
  const delayedResponse = () => {
    if (delayFinished && delayedData) {
      res.json(delayedData); // Send delayed data if available and delay has finished
    } else {
      res.status(500).json({ error: "Data not available" }); // Send error if no delayed data or delay hasn't finished
    }
  };

  // Delay for 10 seconds
  setTimeout(() => {
    const sql = "SELECT * FROM Game_Picture WHERE gid = ?"; // Query to fetch image data by ID
    conn.query(sql, [id], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        delayedData = result; // Store data to be sent
        delayFinished = true; // Set delayFinished to true indicating delay has finished
        delayedResponse(); // Call response function after timeout
      }
    });
  }, 10000); // 10 seconds delay
});


// Random Picture and Delay Show Picture
/*router.get("/picture", (req, res) => {
  console.log("sss");
  interface PictureData {
    // Define the structure of the data retrieved from the database
    // Adjust these properties based on the actual structure of your data
    id: number;
    name: string;
    url: string;
    // Add more properties if necessary
  }
  const sql = "SELECT * FROM Game_Picture JOIN state ON Game_Picture.gid = state.GSID ORDER BY RAND() LIMIT 2";


  let delayedData: PictureData[] | null = null; // Variable to store delayed data

  const delayedResponse = () => {
    if (delayedData) {
      res.json(delayedData); // Send delayed data if available
    } else {
      res.status(500).json({ error: "Data not available" }); // Send error if no delayed data
    }
  };

  setTimeout(() => {
    const sql = "SELECT * FROM Game_Picture JOIN state ON Game_Picture.gid = state.GSID ORDER BY RAND() LIMIT 2";

    conn.query(sql, (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        delayedData = result; // Store data to be sent
        delayedResponse(); // Call response function after timeout
      }
    });
  }, 60000); // Delay for 10 seconds
}); */


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
          res.json({ uid: result[0].uid, name: result[0].name, url: result[0].url, gmail });
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


// Initialize Firebase //Connect firebase
initializeApp(firebaseConfig);
// connect to Storage
const storage = getStorage();
//Middle
class FileMiddleware {
  //Attribute of class
  filename = "";
  //Attribute diskLoader for saving file disk
  public readonly diskLoader = multer({
    // diskStorage = saving file to disk
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 67108864, // 64 MByte
    },
  });
}

const fileupload = new FileMiddleware();
router.post("/game/insert", fileupload.diskLoader.single("file"), async (req, res) => {


  //receive data
  let game: GamePostRequest = req.body;
  console.log(req.body);

  //upload

  //Upload to firebase storage
  const filename = Math.round(Math.random() * 1000) + ".png";
  //Define location to be saved on storage
  const storageRef = ref(storage, "/image/" + filename)
  const metaData = { contentType: req.file!.mimetype };
  //Start upload
  try {
    const snapshot = await uploadBytesResumable(storageRef, req.file!.buffer, metaData);
    //Get url of image from storage
    const url = await getDownloadURL(snapshot.ref);

    // เรียกใช้งานฟังก์ชัน hashPassword เพื่อ hash รหัสผ่าน
    const password = game.password;
    const hashedPassword = hashPassword(password);
    console.log("Hashed password:", hashedPassword);
    //Updata to database
    let sql =
      "INSERT INTO `Gameless`(`name`, `gmail`, `password`, `url`) VALUES (?,?,?,?)";
    sql = mysql.format(sql, [game.name, game.gmail, hashedPassword, url]);
    //request data
    conn.query(sql, (err, result) => {
      if (err) throw err;
      res.status(200).json({ result: "baba" });
    });

  } catch (error) {

  }


});

//point update
router.put("/scoreupdate", async (req, res) => {
  console.log("SDs");

  const data = req.body;
  console.log(data);

  let win: string;
  let scoreA : any;
  let scoreB : any;
  let ra = 1 / (1 + Math.pow(10, (data.scoreB - data.scoreA) / 400));
  let rb = 1 / (1 + Math.pow(10, (data.scoreA - data.scoreB) / 400));



  if (data.win == "A") {
    win = "A";
    scoreA = data.scoreA + 32 * (1 - ra);
    scoreB = data.scoreB + 32 * (0 - rb);

    var newScore1 = data.scoreA +' + 32 * '+'(1 - '+ra+')';
    var newScore2 = data.scoreB +' + 32 * '+'(0 - '+rb+')';
    var scoreUp1 = 32 *(1 - ra);
    var scoreDown1 = 32 *(0 - rb);
  } else if (data.win == "B") {
    win = "B";
    scoreA = data.scoreA + 32 * (0 - ra);
    scoreB = data.scoreB + 32 * (1 - rb);

    var newScore1 = data.scoreA +' + 32 * '+'(0 - '+ra+')';
    var newScore2 = data.scoreB +' + 32 * '+'(1 - '+rb+')';
    var scoreUp1 = 32 *(0 - ra);
    var scoreDown1 = 32 *(1 - rb);
  }

  if (scoreA <= 0) {
    scoreA = 0;
  }

  if (scoreB <= 0) {
    scoreB = 0;
  }
  console.log(scoreA)
  console.log(scoreB)


  const currentDate = new Date().toISOString().slice(0, 10);
  let check1: any = await new Promise((resolve, reject) => {
    conn.query("SELECT sid from state where `date`=? and `GSID`=?", [currentDate, data.gidA], (error, result) => {
      if (error) reject(error);
      resolve(result);
    });
  });

  let check2: any = await new Promise((resolve, reject) => {
    conn.query("SELECT sid from state where `date`=? and `GSID`=?", [currentDate, data.gidB], (error, result) => {
      if (error) reject(error);
      resolve(result);
    });
  });

  let sql1 = "";
  let sql2 = "";


  if (check1.length > 0) {
    sql1 = "update state set `score`=? where `sid`=?";
    sql1 = mysql.format(sql1, [scoreA, check1[0].sid]);
  }
  else {
    sql1 = "INSERT INTO `state`(`GSID`,`date`,`score`) values(?,?,?)";
    sql1 = mysql.format(sql1, [data.gidA, currentDate, scoreA]);
  }

  if (check2.length > 0) {
    sql2 = "update state set `score`=? where `sid`=?";
    sql2 = mysql.format(sql2, [scoreB, check2[0].sid]);
  }
  else {
    sql2 = "INSERT INTO `state`(`GSID`,`date`,`score`) values(?,?,?)";
    sql2 = mysql.format(sql2, [data.gidB, currentDate, scoreB]);
  }

  console.log(sql1);
  console.log(sql2);

 

  Promise.all([
    new Promise((resolve, reject) => {
      conn.query(sql1, (error, result) => {
        if (error) reject(error);
        resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      conn.query(sql2, (error, result) => {
        if (error) reject(error);
        resolve(result);
      });
    })
  ])
    .then(result => {
      res.status(200).json({
        win : win,
        scoreA: scoreA,
        scoreB: scoreB,
        newScore1: newScore1,
        newScore2: newScore2,
        scoreUp: scoreUp1 ,
        scoreDown: scoreDown1 ,
      });
    })
    .catch(error => {
      res.status(400).send(error);
    });

});




router.get("/date", (req, res) => {
  const sql = /*`
    SELECT GSID, SUM(state.score) AS total_score, url 
    FROM Game_Picture 
    JOIN state ON Game_Picture.gid = state.GSID 
    GROUP BY GSID, url 
    ORDER BY total_score DESC 
    LIMIT 10;
  */
    ` SELECT GSID, score, url, @rank := @rank + 1 AS rank
    FROM (
        SELECT GSID, state.score AS score, url 
        FROM Game_Picture 
        JOIN state ON Game_Picture.gid = state.GSID 
        WHERE state.date in(SELECT MAX(date) FROM state)
        GROUP BY GSID, url 
        ORDER BY score DESC 
        LIMIT 10
    ) AS top_scores, (SELECT @rank := 0) AS rank_init; `
    ;
  conn.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});
router.get("/before", (req, res) => {
  const sql = /*`
    SELECT GSID, SUM(state.score) AS total_score, url 
    FROM Game_Picture 
    JOIN state ON Game_Picture.gid = state.GSID 
    GROUP BY GSID, url 
    ORDER BY total_score DESC 
    LIMIT 10;
  */
    ` SELECT GSID, score, url, @rank := @rank + 1 AS rank
    FROM (
        SELECT GSID, state.score AS score, url 
        FROM Game_Picture 
        JOIN state ON Game_Picture.gid = state.GSID 
        WHERE state.date in(SELECT MAX(date)-1 FROM state)
        GROUP BY GSID, url 
        ORDER BY score DESC 
    ) AS top_scores, (SELECT @rank := 0) AS rank_init; `
    ;
  conn.query(sql, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

router.get("/image/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Game_Picture WHERE Game_Picture.uid = ?;";
  conn.query(sql, id, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

router.delete("/image/:id", (req, res) => {
  const id = req.params.id;
  const sql = "delete FROM Game_Picture WHERE Game_Picture.gid = ?;";
  conn.query(sql, id, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result);
    }
  });
});

router.post("/graph/:id", async (req, res) => {
  const id = req.params.id;

  console.log(id);

  let sql = "SELECT DISTINCT DATE_FORMAT(Date, '%Y-%m-%d') AS Date, score  FROM state  WHERE GSID = ? AND DATEDIFF(Date, CURDATE()) <= 7 ORDER BY Date ASC";
  conn.query(sql, id, (err, result) => {
    if (err) throw err;
    res
      .status(200)
      .json(result);
  });
});

router.put("/editPro", async (req, res) => {
  const name = req.body.Nname;
  // const password = req.body.Npassword;
  // const image = req.body.Nimage;
  const id = 36;
  let sql = "UPDATE Gameless SET name = ? WHERE uid = ?";
  conn.query(sql, [name,  id], (err, result) => {
    if (err) throw err;
    res.status(200).json(result);
  });

  router.post("/delay", async (req, res) => {
    let data = req.body;
  
    
    if(data.win == 1){
      let sql =
      "INSERT INTO KeepDL`(pid`, time) VALUES (?,NOW())";
    conn.query(sql, [data.PID1], (err, result) => {
      if (err) throw err;
      res.json(result);
    });
    }
    else{
      let sql =
      "INSERT INTO KeepDL`(pid`, time) VALUES (?,NOW())";
    conn.query(sql, [data.PID2], (err, result) => {
      if (err) throw err;
      res.json(result);
    });
    }
   
  });
  
});

router.get("/", async (req, res) => {
  let sql =
    "DELETE FROM KeepDL WHERE TIMESTAMPDIFF(SECOND,Time , NOW()) >= 10";
  conn.query(sql, async (err, result) => {
    if (err) throw err;
    
    try {
      let s =
        "SELECT Game_Picture.gid as PID,Game_Picture.url as url,state.score as point FROM Game_Picture,state WHERE Game_Picture.gid = state.GSID  and Game_Picture.gid not in(SELECT PID FROM KeepDL ) ORDER BY RAND(),state.date DESC  LIMIT 2";
      let check2 : any = await new Promise((resolve, reject) => {
        conn.query(s, (err, result) => {
          if (err) reject(err);
          resolve(result);
        });
      });

      //console.log(s);
      res.status(200).json({
        pid1: check2[0].PID,
        image1: check2[0].url,
        point1: check2[0].point,

        image2: check2[1].url,
        point2: check2[1].point,
        pid2: check2[1].PID,
      });
    } catch (error) {}
  });
});



