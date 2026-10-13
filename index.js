const express = require("express"); //this requires express from nodes
const path = require("path");
const app = express();
app.set("view engine", "ejs"); // use EJS
app.set("views", "./views"); // where .ejs files are stored
const port = process.env.PORT || 3000;

// Serve static assets (css, js, images) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html from the 'public' folder
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
