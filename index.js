const bigLead = require('./services/thebiglead');
const { questionnaire, getOtions, rl } = require('./services/questionnaire');

const parserConstructor = ({
  openBrowser,
  images,
  download,
  count,
  duplicate,
  date,
  filterByDate
}) => {
  return async () => {
    try {
      if (filterByDate) {
        await bigLead.setPageURL(date);
      }
      await bigLead.init({ openBrowser, images, filterByDate });

      let articlesLinks = await bigLead.getArticlesLinks({ count });

      let { articlesDataArray, htmlArticlesDataArray } = await bigLead.getArticlesDataByLink({
        links: articlesLinks
      });

      let imgs = await bigLead.getImagesLinksAndName(articlesDataArray);

      bigLead.saveDataJSON(articlesDataArray, 'dataContent');
      bigLead.saveDataJSON(htmlArticlesDataArray, 'dataHTML');

      if (download) {
        await bigLead.downloadImages(imgs, { duplicate });
      }
      await bigLead.end();
    } catch (error) {
      // await bigLead.end();
      console.error(error);
    }
  };
};

questionnaire().on('close', async () => {
  console.log('START CODE');
  const options = getOtions();
  const parser = await parserConstructor(options);

  await parser();

  console.log('DONE');
  rl.close();
  process.exit(0);
});
