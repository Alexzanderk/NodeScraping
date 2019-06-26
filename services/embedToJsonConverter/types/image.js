const path = require('path');

module.exports = ({ meta, url }) => {
  const ext = path.extname(url).slice(1);

  return {
    image: {
      type: 'image',
      metadata: {
        url: {
          type: 'url',
          value: url
        },
        path: {
          type: 'text',
          value:
            'shape/cover/sport/Screen-Shot-2019-06-03-at-111949-AM-64843c31ab0726f812c807a7f70f9103'
        },
        credit: {
          type: 'text',
          value: `${meta.credit}`
        },
        provider: {
          type: 'text',
          value: `${meta.copyright
            .split(' ')
            .slice(1)
            .join(' ')}`
        },
        aspectRatio: {
          type: 'text',
          value: meta.aperture
        },
        fullImageUrl: {
          type: 'url',
          value: `${url}`
        },
        fileExtension: {
          type: 'text',
          value: ext
        }
      }
    }
  };
};
