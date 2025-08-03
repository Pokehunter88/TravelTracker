const express = require("express");
const path = require("path");

const app = express();
const PORT = 8080;

// Middleware to handle all incoming requests
app.use((req, res) => {
    if (req.path === "/favicon.ico") {
        res.end();
        return;
    }
    if (req.path === "/") {
        res.redirect("/index.html");
        return;
    }

    // Remove leading slashes to make it a relative path
    const relativePath = path.join(__dirname, req.path.replaceAll("%20", " "));

    // Optional: log it
    console.log(`Requested URL: ${req.url}`);
    console.log(`Resolved relative path: ${relativePath}`);

    // Send back the relative path as a response
    //   res.send(`Relative file path: ${relativePath}`);
    res.sendFile(relativePath);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
