const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://thebiglead.com/';
let DATE_URL = null;

let browser = null;
let page = null;

module.exports = {
  async init({
    openBrowser = true,
    images = true,
    devtools = false,
    filterByDate = false
  } = {}) {
    browser = await puppeteer.launch({
      headless: openBrowser,
      devtools
    });
    page = await browser.newPage();

    if (!images) {
      await page.setRequestInterception(true);

      page.on('request', request => {
        if (request.resourceType() === 'image') {
          request.abort();
        } else {
          request.continue();
        }
      });
    }

    if (!filterByDate) {
      return await page.goto(BASE_URL);
    }
    await page.goto(DATE_URL);
  },

  async getArticlesLinks({ count = 10 } = {}) {
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

        const ext = typeof data.imgLink === 'string' && path.extname(data.imgLink);
        const imageName = typeof data.imgLink === 'string' && path.basename(data.imgLink, ext);

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

  async downloadImages(images, { duplicate = false } = {}) {
    let count = 0;
    let dublicateCount = 0;
    let imagesNames = [];

    for (const image of images) {
      if (image.url !== null) {
        count += 1;

        const exec = image.url.match(/.(jpg|png|JPEG|gif)$/)[0];
        let fileName = image.name;

        let img = await page.goto(image.url, { waitUntil: 'domcontentloaded' });

        if (!duplicate && imagesNames.includes(fileName)) {
          dublicateCount += 1;
        }

        if (duplicate && imagesNames.includes(fileName)) {
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
        !duplicate ? 'find' : 'was saved'
      } `
    );

    return;
  },

  async saveDataJSON(data) {
    try {
      await fs.writeFile(
        './out/data.json',
        JSON.stringify(data),
        'utf-8',
        () => {
          console.log('File data.json saved.');
        }
      );
    } catch (error) {
      console.error(`Some problem with save, look error: ${error}`);
    }
  },

  async setPageURL(url) {
    return DATE_URL = BASE_URL + url;
  },

  async end() {
    await browser.close();
  }
};