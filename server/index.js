const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());

// app.use(express.static("uploads"));

// configuring multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// configuring postgres connection
const pool = new Pool({
  user: "ashwin",
  host: "localhost",
  database: "fileupload",
  password: "ashwin",
  port: 5432,
});

// create files table if it doesn't exist
pool.query(
  "CREATE TABLE IF NOT EXISTS files (" +
    "id SERIAL PRIMARY KEY," +
    "name VARCHAR(255) NOT NULL," +
    "size INTEGER NOT NULL," +
    "mimetype VARCHAR(255) NOT NULL," +
    "data BYTEA" +
    ")",
  (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Files table created or already exists");
    }
  }
);

app.use(bodyParser.json());

// POST route to upload file
app.post("/upload", upload.single("file"), (req, res) => {
  const { filename, mimetype, size } = req.file;
  const data = fs.readFileSync(path.join("uploads/", filename));
  const query =
    "INSERT INTO files(name, size, mimetype, data) VALUES ($1, $2, $3, $4)";
  const values = [filename, size, mimetype, data];
  pool.query(query, values, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error uploading file");
    } else {
      res.send("File uploaded successfully");
    }
  });
});

// GET route to get all files
app.get("/files", (req, res) => {
  const query = "SELECT * FROM files";
  pool.query(query, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving files");
    } else {
      res.send(result.rows);
    }
  });
});

// GET route to download file
app.get("/download/:id", (req, res) => {
  const fileId = req.params.id;
  const query = "SELECT * FROM files WHERE id = $1";
  const values = [fileId];
  pool.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error downloading file");
    } else if (result.rowCount === 0) {
      res.status(404).send("File not found");
    } else {
      const { name, mimetype, data } = result.rows[0];

      // write the file to the downloads folder using writefilesync
      const filePath = path.join("uploads/", name);
      fs.writeFileSync(filePath, data);
      res.download(filePath, name, (err) => {
        if (err) {
          console.error(err);
        }
        // delete the file from the downloads folder after download
        fs.unlinkSync(filePath);
      });
    }
  });
});

app.get("/", (req, res) => {
  res.json("Hello World");
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
