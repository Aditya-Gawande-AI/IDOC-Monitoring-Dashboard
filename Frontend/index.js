var express = require("express");
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
var app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(express.static(__dirname + "/", { index: "dashboard.html" }));

// Serve the assets folder explicitly
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const port = process.env.PORT || 5000;







app.listen(port, function () {
  console.log(`Integration WebApp Frontend server is listening on port ${port}`);
});
