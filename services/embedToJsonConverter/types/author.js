module.exports = ({ author, link }) => {
  const linkArray = link.split('/').filter(Boolean);
  const user = linkArray[linkArray.length - 1];

  return {
    Author: {
      UserId: user,
      Username: user,
      Name: author
    }
  };
};
