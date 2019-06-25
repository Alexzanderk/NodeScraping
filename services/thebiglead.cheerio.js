const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const request = require('request-promise');

const URL = 'https://thebiglead.com/2019/06/14/best-father-child-athlete-combinations-of-all-time/';


(async () => {

  const file = await request(URL);

  const $ = cheerio.load(file)
  
  console.log(file)
})()