const { Router } = require('express');
const router = new Router();
const controller = require('../controllers')


router.get('/parse/:count', controller.parse);

router.get('/get/articles', controller.getArticles);
// router.get('/get/article/:id', );
// router.put('/get/article/:id', );
// router.post('/get/article/:id', );

module.exports = router;