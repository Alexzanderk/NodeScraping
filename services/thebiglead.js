const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://thebiglead.com/';

let browser = null;
let page = null;

module.exports = {
  async init({ image = true } = {}) {
    browser = await puppeteer.launch({
      headless: false
      // handleSIGINT: false
      // devtools: true
    });
    page = await browser.newPage();
    if (!image) {
      await page.setRequestInterception(true);

      page.on('request', request => {
        if (request.resourceType() === 'image') {
          request.abort();
        } else {
          request.continue();
        }
      });
    }

    await page.goto(BASE_URL);
  },

  async scroll({ count, duration = 3000 } = {}) {
    let num = 0;

    while (num < count) {
      num += 1;

      await page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
      await page.waitFor(duration);
    }
  },

  async getArticlesLinks({ count = 5 } = {}) {
    let articlesArray = await page.$$('article');
    let articlesLinks = [];
    let lastArticlesArrayLength = 0;

    try {
      while (articlesArray.length < count) {
        await page.evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
        await page.waitFor(2000);

        articlesArray = await page.$$('article');

        if (lastArticlesArrayLength == articlesArray.length) break;

        lastArticlesArrayLength = articlesArray.length;
      }

      for (const article of articlesArray) {
        let link = await article.$eval('a[itemprop="url"]', element =>
          element.getAttribute('href')
        );
        articlesLinks.push(link);
      }

      articlesLinks = articlesLinks.slice(0, count);
      const uniqArticlesLinks = [...new Set(articlesLinks)];

      return uniqArticlesLinks;
    } catch (error) {
      console.error(error);
    }
  },

  async getArticlesDataByLink({ links = [] } = {}) {
    let articlesDataArray = [];

    if (!links.length) {
      throw new Error('Something wrong, need links array');
    }

    try {
      for (const url of links) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        let data = await page.evaluate(() => ({
          articleLink: window.location.href,
          title:
            document.querySelector('h1.article__headline') &&
            document.querySelector('h1.article__headline').innerText,
          content:
            document.querySelector('div.articleBody') &&
            document.querySelector('div.articleBody').innerText,
          author:
            document.querySelector(
              'div.article__author > p > span[itemprop="author"]'
            ) &&
            document.querySelector(
              'div.article__author > p > span[itemprop="author"]'
            ).innerText,
          datePublished: window.location.href.match(/\d{4}\/\d{2}\/\d{2}/)[0],
          authorLink:
            document.querySelector(
              'div.article__author > p > span[itemprop="author"] > span > a'
            ) &&
            document
              .querySelector(
                'div.article__author > p > span[itemprop="author"] > span > a'
              )
              .getAttribute('href'),
          imgLink:
            document.querySelector('div.article__title > span > img') &&
            document
              .querySelector('div.article__title > span > img')
              .getAttribute('src')
              .split('?')[0]
        }));

        const ext = path.extname(data.imgLink);
        const imageName = path.basename(data.imgLink, ext);

        data.imgName = imageName;

        articlesDataArray.push(data);
      }

      return articlesDataArray;
    } catch (error) {
      console.log(error);
    }
  },

  async getImagesLinksAndName(articles) {
    const imagesLinks = articles.map(item => ({
      url: item.imgLink,
      name: item.imgName
    }));
    return imagesLinks;
  },

  async downloadImages(images, { dublicate = false } = {}) {
    let count = 0;
    let dublicateCount = 0;
    let imagesNames = [];

    for (const image of images) {
      if (image.url !== null) {
        count += 1;

        const exec = image.url.match(/.(jpg|png|JPEG|gif)$/)[0];
        let fileName = image.name;

        let img = await page.goto(image.url, { waitUntil: 'domcontentloaded' });

        if (!dublicate && imagesNames.includes(fileName)) {
          dublicateCount += 1;
        }

        if (dublicate && imagesNames.includes(fileName)) {
          dublicateCount += 1;
          fileName = `${image.name}_${count}`;
        }

        imagesNames.push(image.name);

        await fs.writeFile(
          `./out/img/${fileName + exec}`,
          await img.buffer(),
          err => {
            if (err) {
              console.error(err);
            }
            console.log(`File ${image.name}.jpg saved`);
          }
        );
      }
    }
    console.log(`Saved: ${count} file${count > 1 ? 's' : ''}`);
    console.log(
      `Dublicated names:  ${dublicateCount} ${
        !dublicate ? 'find' : 'was saved'
      } `
    );

    return;
  },

  saveDataJSON(data) {
    try {
      fs.writeFileSync('./out/data.json', JSON.stringify(data), 'utf-8');
      console.log('File data.json saved.');
    } catch (error) {
      console.error(`Some problem with save, look error: ${error}`);
    }
  },

  async end() {
    await browser.close();
  }
};
