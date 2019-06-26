const types = require('./types');

module.exports = {
  convertToJson(data) {
    const result = Object.keys(data).reduce((acc, cur) => {
      if (['image', 'author'].includes(cur)) {
        console.log(cur);
        const typeResult = types[cur](data[cur]);
        return {
          ...acc,
          [cur]: JSON.stringify(typeResult)
        };
      }
      return acc;
    }, {});
    console.log(result);

    return result;
    // debugger;
  }
};
