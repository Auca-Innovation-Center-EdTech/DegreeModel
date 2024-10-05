const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// create express app
const app = express();
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '71nux',
    database: 'innovations',
  });
  
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed:', err);
      process.exit();
    } else {
      console.log('Connected to MySQL Database');
    }
  });

// Setup file storage using multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Create the 'uploads' folder if it doesn't exist
      const dir = 'uploads/';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      cb(null, dir); 
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix);
    },
  });
  
  const upload = multer({ storage: storage });
  
  
  app.post('/university', upload.single('logo'), (req, res) => {
    const { name, location, email } = req.body;
    const logo = req.file ? req.file.filename : null;
  
    
    if (!name || !location || !email) {
      return res
        .status(400)
        .json({ error: 'All fields (name, location, email) are required' });
    }
  
   
    const checkQuery = 'SELECT * FROM university WHERE name = ? OR email = ?';
    db.query(checkQuery, [name, email], (err, results) => {
      if (err) {
        console.error('Error checking university existence:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.length > 0) {
        return res.status(409).json({ error: 'University already exists' });
      }
  
     
      const insertQuery =
        'INSERT INTO university (name, location, email, logo) VALUES (?, ?, ?, ?)';
      db.query(
        insertQuery,
        [name, location, email, logo || ''],
        (err, result) => {
          if (err) {
            console.error('Error inserting university:', err);
            return res.status(500).json({ error: 'Database error' });
          }
  
          res.status(201).json({
            message: 'University added successfully',
            universityId: result.insertId,
          });
        }
      );
    });
  });



//   / GET Route to Fetch University Details
app.get('/universities', (req, res) => {
  const query = 'SELECT * FROM university';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching universities:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json(results);
  });
});

// Degree POST method
app.post('/degree', async (req, res) => {
  const { link, issue_date, university_id } = req.body;

  // Validate inputs
  if (!link || !issue_date || !university_id) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Check if the university exists
  const universityCheckQuery = 'SELECT * FROM university WHERE id = ?';
  db.query(universityCheckQuery, [university_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res
        .status(500)
        .json({ error: 'Database error. Please try again.' });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'University does not exist.' });
    }

    // Check if the degree already exists
    const degreeCheckQuery =
      'SELECT * FROM degree WHERE link = ? AND university_id = ?';
    db.query(degreeCheckQuery, [link, university_id], (err, results) => {
      if (err) {
        console.error('Degree already exists:', err);
        return res
          .status(500)
          .json({ error: 'Please try again.' });
      }

      if (results.length > 0) {
        return res
          .status(400)
          .json({ error: 'Degree already exists for this university.' });
      }

      // Insert new degree record
      const insertDegreeQuery =
        'INSERT INTO degree (link, issue_date, university_id) VALUES (?, ?, ?)';
      db.query(
        insertDegreeQuery,
        [link, issue_date, university_id],
        (err, results) => {
          if (err) {
            console.error('Database error:', err);
            return res
              .status(500)
              .json({ error: 'Error adding degree. Please try again.' });
          }

          res.status(201).json({
            message: 'Degree added successfully.',
            degreeId: results.insertId,
          });
        }
      );
    });
  });
});

  
app.get('/degrees', (req, res) => {
    // Query to get all degrees
    const getAllDegreesQuery = 'SELECT * FROM degree';
  
    db.query(getAllDegreesQuery, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res
          .status(500)
          .json({ error: 'Database error. Please try again.' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'No degrees found.' });
      }
  
      res.status(200).json(results);
    });
  });






// start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


