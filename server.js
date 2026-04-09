import express from "express";
import fetch from "node-fetch";
import { pipeline } from "stream";
import { promisify } from "util";

const app = express();
const streamPipeline = promisify(pipeline);

/* PROXY */
app.get("/proxy", async (req, res) => {
  let url = req.query.url;

  if (!url) return res.status(400).send("No URL");

  try {
    if (!url.startsWith("http")) {
      url = "https://" + url;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*"
      }
    });

    const contentType = response.headers.get("content-type") || "";

    res.setHeader("Access-Control-Allow-Origin", "*");

    /* ⚡ STREAM NON-HTML */
    if (!contentType.includes("text/html")) {
      res.setHeader("Content-Type", contentType);
      await streamPipeline(response.body, res);
      return;
    }

    /* HTML */
    let html = await response.text();
    const base = new URL(url);

    /* 🔄 REWRITE URLs */
    html = html.replace(
      /(href|src|action)=["']([^"']+)["']/gi,
      (match, attr, link) => {
        try {
          let newUrl;

          if (link.startsWith("http")) newUrl = link;
          else if (link.startsWith("//")) newUrl = "https:" + link;
          else newUrl = new URL(link, base).href;

          return `${attr}="/proxy?url=${encodeURIComponent(newUrl)}"`;
        } catch {
          return match;
        }
      }
    );

    /* 🔄 FIX CSS url() */
    html = html.replace(
      /url\(["']?([^"')]+)["']?\)/gi,
      (match, link) => {
        try {
          let newUrl = link.startsWith("http")
            ? link
            : new URL(link, base).href;

          return `url("/proxy?url=${encodeURIComponent(newUrl)}")`;
        } catch {
          return match;
        }
      }
    );

    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    res.status(500).send("Proxy Error");
  }
});

/* ROOT */
app.get("/", (req, res) => {
  res.send("Proxy running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));
