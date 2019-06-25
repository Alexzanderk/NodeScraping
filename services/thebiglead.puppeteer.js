const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const request = require('request');
const cloudinary = require('cloudinary').v2;

require('dotenv').config()

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
})

const BASE_URL = 'https://thebiglead.com/';

let browser = null;
let page = null;


module.exports = {
  async init({ openBrowser = true, images = false, devtools = false, url = BASE_URL }) {
    browser = await puppeteer.launch({
      headless: openBrowser,
      devtools
    });
    page = await browser.newPage();

    await page._client.send('Network.enable', {
      maxResourceBufferSize: 1024 * 1204 * 100,
      maxTotalBufferSize: 1024 * 1204 * 200
    })

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
    await page.goto(url);
  },

  async getArticlesLinks({ count = 10 }) {
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

      return articlesLinks;
    } catch (error) {
      console.error(error);
    }
  },

  async getArticlesDataByLink({ links }) {
    let htmlArticlesDataArray = []
    let articlesDataArray = [];

    if (!links.length) {
      throw new Error('Something wrong, need links array');
    }

    try {
      for (const url of links) {
        let body = [];

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const inlineTextObj = html => ({
          type: 'inline-text',
          value: { html }
        })

        const imageObj = image => ({
          type: 'image',
          value: image
        })

        const { titleHtml, contentHtml, authorObj, publishedObj, image } = await page.evaluate(() => {
          // let body = [];

          const titleHtml = document.querySelector('h1.article__headline') &&
            document.querySelector('h1.article__headline').innerHTML;

          const contentHtml = document.querySelector('div.articleBody') &&
            document.querySelector('div.articleBody').innerHTML;

          const authorObj = {
            fullName: document.querySelector(
              'div.article__author > p > span[itemprop="author"]'
            ) &&
              document.querySelector(
                'div.article__author > p > span[itemprop="author"]'
              ).innerHTML,
            link: document.querySelector(
              'div.article__author > p > span[itemprop="author"] > span > a'
            ) &&
              document
                .querySelector(
                  'div.article__author > p > span[itemprop="author"] > span > a'
                )
                .getAttribute('href'),
          }

          const publishedObj = {

            date: window.location.href.match(/\d{4}\/\d{2}\/\d{2}/)[0],
            html: `<span>${window.location.href.match(/\d{4}\/\d{2}\/\d{2}/)[0]}</span>`
          };

          const imgLink = document.querySelector('div.article__title > span > img') &&
            document
              .querySelector('div.article__title > span > img')
              .getAttribute('src')
              .split('?')[0];



          // const ext = path.extname(imgLink);
          // const baseName = path.basename(imgLink, ext);

          // console.log({
          //   ext, baseName, imgLink
          // })
          const image = {
            // name: baseName,
            link: imgLink,
            description: document.querySelector('div.article__title > span > img') &&
              document
                .querySelector('div.article__title > span > img')
                .getAttribute('data-image-title'),
            // fileExtension: ext,
            // pathToImage: `./img/${baseName + ext}`,
            rawImageUrl: document.querySelector('div.article__title > span > img') &&
              document
                .querySelector('div.article__title > span > img')
                .getAttribute('src')
          }


          return {
            titleHtml,
            contentHtml,
            authorObj,
            publishedObj,
            image
          }

        });

        const ext = typeof image.link === 'string' && path.extname(image.link);
        const baseName = typeof image.link === 'string' && path.basename(image.link, ext);
        image.name = baseName;
        image.fileExtension = ext;
        image.pathToImage = `./img/${baseName + ext}`;

        body.push(inlineTextObj(titleHtml))
        body.push(inlineTextObj(contentHtml))
        body.push(inlineTextObj(authorObj.fullName))
        body.push(inlineTextObj(publishedObj.html))
        body.push(imageObj(image))

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

        // const ext =
        //   typeof data.imgLink === 'string' && path.extname(data.imgLink);
        const imageName =
          typeof data.imgLink === 'string' && path.basename(data.imgLink, ext);

        data.imgName = imageName;

        articlesDataArray.push(data);
        htmlArticlesDataArray.push({ body });
      }

      return { articlesDataArray, htmlArticlesDataArray };
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

  async downloadImages(articlesDataArray, { duplicate = false } = {}) {
    let count = 0;
    let dublicateCount = 0;
    let imagesNames = [];
    let articlesWithCloudLink = []

    for (const article of articlesDataArray) {
      if (article.imgLink !== null) {
        count += 1;

        const ext = article.imgLink.match(/.(jpg|png|JPEG|gif)$/)[0];
        let filename = article.imgName;

        if (!duplicate && imagesNames.includes(filename)) {
          dublicateCount += 1;
        }

        if (duplicate && imagesNames.includes(filename)) {
          dublicateCount += 1;
          filename = `${image.name}_${count}`;
        }

        imagesNames.push(article.imgName);

        let file = fs.createWriteStream(`./out/img/${filename + ext}`);
        const upload_stream = cloudinary.uploader.upload_stream({ public_id: filename }, (err, image) => {
          if (err) { console.log(err) }
          console.log(image)
          articlesWithCloudLink.push({ ...article, cloud: image.url })
          // console.log({ articlesWithCloudLink })
        })



        await new Promise((resolve, reject) => {
          request(article.imgLink)
            .pipe(upload_stream)
            .pipe(file)
            .on('finish', () => {
              console.log(`${filename} saved`)
              resolve();
            }).on('error', (error) => {
              reject(error)
            });

        }).catch(error => console.log(`${filename} has an error on download. ${error}`));

      }

    }

    // console.log({ articlesWithCloudLink })

    console.log(`Saved: ${count} file${count > 1 ? 's' : ''}`);
    console.log(
      `Dublicated names:  ${dublicateCount} ${
      !duplicate ? 'find' : 'was saved'
      } `
    );

    return;
  },

  async saveDataJSON(data, fileName) {
    try {
      await fs.writeFile(
        `./out/${fileName}.json`,
        JSON.stringify(data),
        'utf-8',
        () => {
          console.log(`File ${fileName} saved!`);
        }
      );
    } catch (error) {
      console.error(`Some problem with save, look error: ${error}`);
    }
  },

  async end() {
    await browser.close();
  }
};
