import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/proxy", async (req, res) => {
  let url = req.query.url;

  if (!url) return res.send("Missing URL");

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type") || "text/html";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");

    const text = await response.text();
    res.send(text);

  } catch {
    res.send("Error loading site");
  }
});

app.get("/", (req,res)=>{
  res.send("proxy running");
});

app.listen(3000);
