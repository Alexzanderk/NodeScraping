const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Article = new Schema(
  {
    articleLink: String,
    title: String,
    content: String,
    author: String,
    datePublished: String,
    authorLink: String,
    imgLink: String,
    imgName: String
  },
  {
    toJSON: { versionKey: false, getters: true }
  }
);

module.exports = mongoose.model('Article', Article);
