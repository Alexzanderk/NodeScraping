const bigLead = require('./services/thebiglead');

(async () => {
  try {
    await bigLead.init({ image: false });

    let articlesLinks = await bigLead.getArticlesLinks({ count: 10 });

    let articles = await bigLead.getArticlesDataByLink({
      links: articlesLinks
    });

    let imgs = await bigLead.getImagesLinksAndName(articles);

    bigLead.saveDataJSON(articles);

    await bigLead.downloadImages(imgs)

    await bigLead.end();

  } catch (error) {
    await bigLead.end();
    console.error(error);
  }
})();
