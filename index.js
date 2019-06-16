const bigLead = require('./services/thebiglead');
const { questionaries, getOtions, rl } = require('./services/questionaris');

const parserConstructor = ({ openBrowser, images, download, count, dublicate }) => {
  return (async () => {
    try {
      await bigLead.init({ openBrowser, images });

      let articlesLinks = await bigLead.getArticlesLinks({ count });

      let articles = await bigLead.getArticlesDataByLink({
        links: articlesLinks
      });

      let imgs = await bigLead.getImagesLinksAndName(articles);
      
      bigLead.saveDataJSON(articles);
      
      if (download) {
        await bigLead.downloadImages(imgs, { dublicate });
      }
      await bigLead.end();
      

    } catch (error) {
      // await bigLead.end();
      console.error(error);
    }
  })();
};

questionaries().on('close', async () => {
  console.log('START CODE');
  const options = getOtions();
  await parserConstructor(options);
  
  console.log('DONE')
  rl.close();
  process.exit(0);

});