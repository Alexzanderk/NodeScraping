const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const request = require('request-promise');
// const types = require('./embedToJsonConverter/types');

module.exports = {
  async getPaginationLinks(url) {
    const response = await request(url);
    const $ = cheerio.load(response);

    const paginationLinks =
      $('.article__pagination > a').html() ||
      $('.articleBody > a').attr('href');

    return [url, paginationLinks];
  },

  async parseUrl(urls = []) {
    let count = 0;
    let image = {};
    let title = null;
    let author = {};
    let date = {};
    let content = {};
    let tags = null;

    const getResponse = async url => await request(url);

    const getData = async (response, i) => {
      count += 1;

      if (i === 0) {
        const $ = cheerio.load(response);

        image = {
          meta: JSON.parse(
            $('span[itemprop="image"] > img').attr('data-image-meta')
          ),
          url: $('span[itemprop="image"] > img').attr('data-orig-file')
        };
        title = $('.article__headline').text();
        author = {
          author: $(
            'div.article__author > p > span[itemprop="author"] > span[itemprop="name"] > a[rel="author"]'
          ).text(),
          link: $('span[itemprop="author"] > span[itemprop="name"] > a').attr(
            'href'
          )
        };
        date = {
          text: $('span[itemprop="datePublished"]')
            .text()
            .trim(),
          date: $('span[itemprop="datePublished"]').attr('content')
        };
        content = {
          body: $('div.articleBody[itemprop="articleBody"]').html(),
          childrenLength: $(
            'div.articleBody[itemprop="articleBody"]'
          ).children().length
        };
        tags = $('.post-tags')
          .text()
          .split(',');
      } else {
        console.log('2');
        const $ = cheerio.load(response);

        content.body = [
          content.body,
          $('div.articleBody[itemprop="articleBody"]').html()
        ].join();
        content.childrenLength =
          $('div.articleBody[itemprop="articleBody"]').children().length +
          content.childrenLength;
      }
    };

    const promises = urls.map(url => getResponse(url));

    for await (const response of promises) {
      getData(response, count);
    }

    return {
      image,
      title,
      author,
      date,
      content,
      tags
    };
  },

};
