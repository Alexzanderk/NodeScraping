const bigLead = require('../services/thebiglead.service');

module.exports = {
  parserConstructor({ count, download }) {
    let articles = [];
    return async () => {
      try {
        await bigLead.init();
        let articlesLinks = await bigLead.getArticlesLinks({ count });
        console.log(articlesLinks);
        // if (articlesLinks.lenth > 10) {

        // }
        let articlesData = await bigLead.getArticlesDataByLink({
          links: articlesLinks
        });
        articles.push(...articlesData);
        bigLead.saveDataJSON(articles);
        // if (download) {
        //   let imgs = await bigLead.getImagesLinksAndName(articles);
        //   await bigLead.downloadImages(imgs);
        // }
        await bigLead.end();

        return articles;
      } catch (error) {
        console.error(error);
      }
    };
  }
};
