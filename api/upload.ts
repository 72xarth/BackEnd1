// api เส้นที่ 1
import express from "express";
import multer from "multer";
import {initializeApp} from "firebase/app";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { conn } from "../dbconnect";

export const router = express.Router(); //Router() คือตัวจัดการเส้นทาง


const firebaseConfig = {
  apiKey: "AIzaSyCJV56JCebsYq_omskDpXT6MEXhuLCbRo4",
  authDomain: "project01-69142.firebaseapp.com",
  projectId: "project01-69142",
  storageBucket: "project01-69142.appspot.com",
  messagingSenderId: "985064760337",
  appId: "1:985064760337:web:586f2b27a8d653c0c5fdb0",
  measurementId: "G-0QE6YDDGGH"
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

// POST /upload + file
  const fileupload = new FileMiddleware();
  //fileupload.diskloader.single ส่งไฟล์และ upload ลง
  router.post("/:id", fileupload.diskLoader.single("file"), async (req, res)=>{
     let id = req.params.id;
     console.log(id);
     

    //Upload to firebase storage
    const filename = Math.round(Math.random() * 1000)+ ".png";
    //Define location to be saved on storage
    const storageRef = ref(storage, "/image/" + filename )
    const metaData = { contentType : req.file!.mimetype};
    //Start upload
    const snapshot = await uploadBytesResumable(storageRef, req.file!.buffer, metaData);
    //Get url of image from storage
    const url = await getDownloadURL(snapshot.ref);

  // Insert URL into MySQL
  conn.query('INSERT INTO `Game_Picture`(`url`,`uid`) VALUES (?,?)', [url,id], (error, results, fields) => {
      if (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal server error' });
      } else {
          res.status(200).json({ filename: url });
      }
  });


  });

