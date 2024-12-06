const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors"); // Import cors

let Url = "";
let WantPrice = "";
let Email = "";
const Password = "qqqshjkchumqpukn";
let intervalId = null;
const port = 5005;

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors()); // Enable CORS for all routes (allows cross-origin requests)

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post("/api", (req, res) => {
  Url = req.body.url;
  WantPrice = req.body.wantPrice;
  Email = req.body.email;

  console.log("Received URL: ", Url);
  console.log("Received Want Price: ", WantPrice);
  console.log("Received Email: ", Email);

  // Validate the URL
  if (!Url.match(/^https?:\/\/[\w\-\.]+/)) {
    return res.status(400).send("Please enter a valid URL");
  }

  if (isNaN(WantPrice) || WantPrice <= 0) {
    return res.status(400).send("Please enter a valid price");
  }
  if (!Email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).send("Please enter a valid email");
  }

  // Check if all values are provided
  if (!Url || !WantPrice || !Email || !Password) {
    return res.status(400).send("Missing required fields");
  }
  // Check availability and start tracking
  if (intervalId) {
    clearInterval(intervalId); // Clear any existing interval
  }

  // Start price tracking once a new request is received
  intervalId = setInterval(() => startTracking(intervalId), 60 * 60 * 1000); // Track every hour
  startTracking(intervalId); // Track immediately
  res.send("Price tracking started.");
  console.log("Price tracking started.");
});

const startTracking = async (intervalId) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    );
    await page.goto(Url);
    await page.reload();

    let price = await page.evaluate(() => {
      const priceElement = document.querySelector(".a-price-whole");
      return priceElement ? priceElement.innerText : null;
    });

    let symbol = await page.evaluate(() => {
      const symbolElement = document.querySelector(".a-price-symbol");
      return symbolElement ? symbolElement.innerText : null;
    });

    let convertedPrice = price ? parseInt(price.replace(/,/g, "")) : null;
    if (
      symbol === "₹" &&
      convertedPrice !== null &&
      convertedPrice <= WantPrice
    ) {
      console.log("Price dropped");

      // Send email logic
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: Email,
          pass: Password,
        },
      });

      let mailOptions = {
        from: `Price Tracker <${Email}>`,
        to: Email,
        subject: `Price dropped to ₹${convertedPrice}`,
        text: `The price has dropped to ₹${convertedPrice}. Check the Amazon link: ${Url}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent successfully:", info.response);
          clearInterval(intervalId); // Stop tracking after sending email
          console.log("Price tracking stopped.");
        }
      });
    } else {
      console.log("Price has not dropped below the desired amount.");
    }

    await browser.close();
  } catch (error) {
    console.error("Error during price tracking:", error);
  }
};
