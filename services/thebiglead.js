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
      console.log('HERE  getArticlesDataByLink', error);
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
    let restarted = false;

    for (const image of images) {
      if (!restarted) {
        await page.reload();
        restarted = true;
      }
      if (image.url !== null) {
        count += 1;

        const ext = image.url.match(/.(jpg|png|JPEG|gif)$/)[0];
        let fileName = image.name;

        let img = await page.goto(image.url, {
          waitUntil: 'domcontentloaded'
        });

        if (!duplicate && imagesNames.includes(fileName)) {
          dublicateCount += 1;
        }

        if (duplicate && imagesNames.includes(fileName)) {
          dublicateCount += 1;
          fileName = `${image.name}_${count}`;
        }

        imagesNames.push(image.name);

        await fs.writeFile(
          `./out/img/${fileName + ext}`,
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

  async setPageURL(url) {
    return (DATE_URL = BASE_URL + url);
  },

  async end() {
    await browser.close();
  }
};
