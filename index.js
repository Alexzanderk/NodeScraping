const bigLead = require('./services/thebiglead');

(async () => {
  const getArgvValue = flag => {
    const index = process.argv.indexOf(flag);
    const value = process.argv[index + 1]
    return index < 0 ? undefined
      : value ? value
        : true;
  }

  const url = getArgvValue('-u');
  const count = getArgvValue('-c');
  const downloadImages = getArgvValue('-d');

  await bigLead.init({ url })
  const articlesLinks = await bigLead.getArticlesLinks({ count });
  const { articlesDataArray, htmlArticlesDataArray } = await bigLead.getArticlesDataByLink({
    links: articlesLinks
  });
  await bigLead.end();
  
  await bigLead.saveDataJSON(articlesDataArray, 'dataContent');
  await bigLead.saveDataJSON(htmlArticlesDataArray, 'dataHTML');

  if (downloadImages) {
    let imgs = await bigLead.getImagesLinksAndName(articlesDataArray);
    await bigLead.downloadImages(imgs);
  }

})();