const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const { Url, WantPrice, Email, Password } = require("./config.json");

const startTracking = async () => {
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
setInterval(startTracking, 60 * 60 * 1000);
startTracking();
