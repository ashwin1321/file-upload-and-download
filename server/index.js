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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
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
  `CREATE TABLE IF NOT EXISTS patient_data (
    id SERIAL PRIMARY KEY,
    patient_name VARCHAR(255) NOT NULL,
    symptoms TEXT,
    test TEXT,
    diagnosis TEXT,
    file_name VARCHAR(255),
    mime_type VARCHAR(255),
    data BYTEA )`,
  (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Files table created or already exists");
    }
  }
);

app.use(bodyParser.json());

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { filename, mimetype, size } = req.file;
    const { patient_name, symptoms, test, diagnosis } = req.body;

    const data = fs.readFileSync(path.join("uploads/", filename));

    const query =
      "INSERT INTO patient_data(patient_name, symptoms, test, diagnosis, file_name, mime_type, data) VALUES ($1, $2, $3, $4, $5, $6, $7)";
    const values = [patient_name, symptoms, test, diagnosis, filename, mimetype, data]

    pool.query(query, values, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error uploading file");
      } else {
        res.send("File uploaded successfully");
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/download/:id", (req, res) => {
  const fileId = req.params.id;
  console.log(fileId)
  const query = "SELECT * FROM patient_data WHERE id = $1";
  const values = [fileId];
  pool.query(query, values, (err, result) => {

    // console.log(result.rows)
    if (err) {
      console.error(err);
      res.status(500).send("Error downloading file");
    } else if (result.rowCount === 0) {
      res.status(404).send("File not found");
    } else {
      const { file_name, mime_type, data } = result.rows[0];

      // write the file to the downloads folder using writefilesync
      const filePath = path.join("uploads/", file_name);
      fs.writeFileSync(filePath, data);
      res.download(filePath, file_name, (err) => {
        if (err) {
          console.error(err);
        }
        // delete the file from the downloads folder after download
        fs.unlinkSync(filePath);
      });
    }
  });
});

app.get('/patients', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM patient_data');
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
