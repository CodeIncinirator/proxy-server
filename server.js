import express from "express";
import puppeteer from "puppeteer";

const app = express();

app.get("/proxy", async (req, res) => {
  let url = req.query.url;

  if (!url) return res.send("No URL");

  // fix missing https
  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    const content = await page.content();

    await browser.close();

    res.setHeader("Content-Type", "text/html");
    res.send(content);

  } catch (err) {
    res.send("Error loading page");
  }
});

app.listen(3000, () => console.log("Running on port 3000"));