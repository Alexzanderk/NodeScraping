const bigLead = require('../../services/thebiglead.service');
const utils = require('../../utils/bigLead.util');
const Article = require('../../models/Articlel');

let info;

module.exports = {
  async parse(req, res) {
    const { download } = req.query;
    const { count } = req.params;

    const parser = utils.parserConstructor({ count, download });
    res.json({ status: 200 });

    const data = await parser();
    Article.insertMany(data);
    console.log('DONE SAVED')
  },

  async getArticles(req, res) {
    const articles = await Article.find({});

    res.json(articles);
  }
};
