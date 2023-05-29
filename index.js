const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');

const url = require('./config.json').Url;
const RequiredPrice = require('./config.json').WantPrice;
const Email = require('./config.json').Email;
async function configureBrowser() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url);
  return page;
}

async function checkPrice(page) {
  await page.reload();
  let price = await page.evaluate(() => {
    return document.querySelector('.a-offscreen').innerText;
  }
  );
  console.log(price);
  let symbol = price.slice(0, 1);
  console.log(symbol);
  let convertedPrice = parseInt(price.slice(1).replace(/,/g, ''));
  console.log(convertedPrice);

  let new_price = {
    symbol,
    convertedPrice
  }
  if (new_price.symbol === '₹' && new_price.convertedPrice < RequiredPrice) {
    sendNotification(new_price);
  }

}





async function startTracking() {
  let page = await configureBrowser();
  let job = new CronJob('*/30 * * * *', function () {
    checkPrice(page);
  }
    , null, true, null, null, true);
  job.start();
}


async function sendNotification(price) {
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'patel.aryan.eee21@itbhu.ac.in',
      pass: 'Aryan@732'
    }
  });
  let textToSend = 'Price dropped to ' + price.symbol + price.convertedPrice;
  let htmlText = `<a href="${url}">Link</a>`;
  let info = await transporter.sendMail({
    from: '<aryanpatel2725@gmail.com>',
    to: Email,
    subject: 'Price dropped to ' + price.symbol + price.convertedPrice,
    text: textToSend,
    html: htmlText
  }).then(console.log("Email sent")).catch(console.error);
}


startTracking();