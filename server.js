import express from "express";
import next from "next";

const port = process.env.PORT || 3001;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Serve static files
  server.use(express.static("public"));

  // Custom route (optional)
  server.get("/custom", (req, res) => {
    res.send("Custom route working!");
  });

  // Handle Next.js pages
  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});