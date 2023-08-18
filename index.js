const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

const url = require('./config.json').Url;
console.log(url);
const RequiredPrice = require('./config.json').WantPrice;
const Email = require('./config.json').Email;
const Password = require('./config.json').Password;
console.log(Email);
console.log(RequiredPrice);
console.log(Password);



const startTracking = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  console.log(page);
  await page.reload();
  let price = await page.evaluate(() => {
    return document.querySelector('.a-price-whole').innerText;
  }
  );
  let symbol = await page.evaluate(() => {
    return document.querySelector('.a-price-symbol').innerText;
  }
  );
  console.log(price);
  console.log(symbol);
  let convertedPrice = parseInt(price.replace(/,/g, ''));
  console.log(convertedPrice);
  if (symbol === '₹' && convertedPrice < RequiredPrice) {
    console.log("Price dropped");
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: Email,
        pass: Password
      }
    });
    let mailOptions = {
      from: Email,
      to: Email,
      subject: 'Price dropped to ' + convertedPrice,
      text: 'Check the amazon link ' + url
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      }
      else {
        console.log('Email sent: ' + info.response);
      }
    }
    );
  }
}

const job = new CronJob('*/30 * * * *', function () {
  startTracking();
}
  , null, true, null, null, true);
