// --- Import Required Libraries ---
// 'express' is a very popular and easy-to-use library for building web servers with Node.js
const express = require('express');

// 'path' helps us work with file and directory paths in a way that works on any operating system
const path = require('path');


// --- Initialize the App ---
const app = express(); // Creates our main application object
const PORT = process.env.PORT || 3000; // Sets the port for our server to listen on


// --- Set Up Middleware ---
// This is the magic line that tells our server to make the 'public' folder accessible to the web.
// This is how our server will find and send the index.html and style.css files.
app.use(express.static(path.join(__dirname, 'public')));


// --- Define Routes (for later) ---
// We will add our login and API routes here in the future.
// For example: app.post('/login', ...);


// --- Start the Server ---
// This line tells our server to start listening for incoming requests on our specified port.
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
