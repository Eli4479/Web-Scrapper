const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

const url = require('./config.json').Url;
const RequiredPrice = require('./config.json').WantPrice;
const Email = require('./config.json').Email;
const Password = require('./config.json').Password;

const startTracking = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);
  await page.reload();
  let price = await page.evaluate(() => {
    return document.querySelector('.a-price-whole').innerText;
  }
  );
  let symbol = await page.evaluate(() => {
    return document.querySelector('.a-price-symbol').innerText;
  }
  );
  let convertedPrice = parseInt(price.replace(/,/g, ''));
  if (symbol === '₹' && convertedPrice < RequiredPrice) {
    console.log("Price dropped");
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      auth: {
        user: Email,
        pass: Password
      }
    });

    let mailOptions = {
      from: 'aryan <patel.aryan.eee21@itbhu.ac.in>',
      to: 'aryanpatel2725@gmail.com',
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
