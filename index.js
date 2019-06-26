const parser = require('./services/thebiglead.cheerio');
const converter = require('./services/embedToJsonConverter');

// const types = require('./services/embedToJsonConverter/types');

const URL =
  'https://thebiglead.com/2019/06/14/best-father-child-athlete-combinations-of-all-time/';

(async () => {
  try {
    const links = await parser.getPaginationLinks(URL);
    const data = await parser.parseUrl(links);
    const convertedData = converter.convertToJson(data);

    debugger;

  } catch (error) {
    console.error(error);
  }
})();
