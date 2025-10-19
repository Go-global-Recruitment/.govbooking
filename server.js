const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ------------------------
// CSV folder for Final Summary
// ------------------------
const CSV_FOLDER = 'csv';
if (!fs.existsSync(CSV_FOLDER)) fs.mkdirSync(CSV_FOLDER);
const SUMMARY_CSV = path.join(CSV_FOLDER, 'CSV.csv');
if (!fs.existsSync(SUMMARY_CSV)) {
  fs.writeFileSync(SUMMARY_CSV, 'Booking Number,User Name,Document Type,Status\n');
}

// ------------------------
// JSON database file
// ------------------------
const DB_FILE = 'submissions.json';
function readSubmissions() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function writeSubmissions(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ------------------------
// Generate unique booking reference
// ------------------------
function generateBookingReference() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 900) + 100;
  return `BOOK-${timestamp}-${random}`;
}

// ------------------------
// Configure multer
// ------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// ------------------------
// Submit visa application
// ------------------------
app.post('/api/submit-visa-application', upload.any(), (req, res) => {
  const fields = req.body;
  const files = req.files || [];

  const booking_reference = generateBookingReference();
  const submissions = readSubmissions();

  submissions.push({
    id: Date.now(),
    booking_reference,
    status: 'Pending',
    rejected_fields: [],
    fields,
    files: files.map(f => ({ original: f.originalname, path: f.path }))
  });

  writeSubmissions(submissions);
  res.json({ success: true, booking_reference });
});

// ------------------------
// Get all submissions
// ------------------------
app.get('/api/submissions', (req, res) => {
  const submissions = readSubmissions();
  res.json(submissions);
});

// ------------------------
// Accept/Reject submission
// ------------------------
app.post('/api/review/:booking_reference', (req, res) => {
  const { booking_reference } = req.params;
  const { status, rejected_fields } = req.body;
  const submissions = readSubmissions();
  const index = submissions.findIndex(s => s.booking_reference === booking_reference);
  if (index === -1) return res.status(404).json({ success: false, message: 'Not found' });

  submissions[index].status = status || submissions[index].status;
  submissions[index].rejected_fields = rejected_fields || [];
  writeSubmissions(submissions);

  res.json({ success: true });
});

// ------------------------
// Download CSV of all submissions
// ------------------------
app.get('/api/download', (req, res) => {
  const submissions = readSubmissions();
  if (submissions.length === 0) return res.status(404).send('No submissions');

  const flat = submissions.map(s => ({
    booking_reference: s.booking_reference,
    status: s.status,
    rejected_fields: s.rejected_fields.join(', '),
    ...s.fields
  }));

  const parser = new Parser();
  const csv = parser.parse(flat);

  res.header('Content-Type', 'text/csv');
  res.attachment('submissions.csv');
  res.send(csv);
});

// ------------------------
// Save Final Summary CSV
// ------------------------
app.post('/api/save-summary', (req, res) => {
  const { docs } = req.body; // docs = array of {booking, name, docType, status}
  if (!docs || !Array.isArray(docs)) return res.status(400).json({ error: 'Invalid docs data' });

  const rows = docs.map(d =>
    `${d.booking},${d.name},${d.docType},${d.status}`
  ).join('\n') + '\n';

  fs.appendFileSync(SUMMARY_CSV, rows);
  res.json({ success: true, message: 'Summary data saved to CSV folder' });
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
// Get submission by ID number
app.get('/api/submission/:id_number', (req, res) => {
  const { id_number } = req.params;
  const submissions = readSubmissions();

  const submission = submissions.find(s => s.fields.id_number === id_number);

  if (!submission) return res.status(404).json({ success: false, message: 'No submission found' });

  res.json({ success: true, submission });
});

