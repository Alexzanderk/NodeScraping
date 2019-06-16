const readLine = require('readline');

const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>> '
});

let openBrowser, images, download, count, dublicate;
let index = 0;

const questions = [
  'Open browser? (y/n) ',
  'Load images in browser? (y/n) ',
  'Count articles you need to scrape, default 10?  ',
  'Download images? (y/n) ',
  'If dublicate images, download renamed copy? (y/n) '
  // 'Filters'
];

const setQuestions = (subLine = '') => {
  if (index == questions.length) {
    rl.close();
    return;
  }

  rl.setPrompt(questions[index] + subLine);
  rl.prompt();
  return;
};

const checkAnswers = answer => {
  const regexp = /^(y|n)$/g;
  const valid = answer.match(regexp);
  switch (index) {
    case 0:
      index += 1;

      if (valid) {
        if (valid.includes('y')) {
          openBrowser = false;
        } else {
          openBrowser = true;
        }
        setQuestions();
      } else {
        index -= 1;
        setQuestions('Please write "y" or "n"!');
      }
      break;

    case 1:
      index += 1;

      if (valid) {
        if (valid.includes('y')) {
          images = true;
        } else {
          images = false;
        }
        setQuestions();
      } else {
        index -= 1;
        setQuestions('Please write "y" or "n"!');
      }
      break;

    case 2:
      index += 1;

      if (parseFloat((answer = answer || 10)) > 0) {
        count = parseFloat(answer);
        setQuestions();
      } else {
        index -= 1;
        setQuestions('Please enter number');
      }
      break;

    case 3:
      index += 1;

      if (valid) {
        if (valid.includes('y')) {
          download = true;
        } else {
          download = false;
        }
        setQuestions();
      } else {
        index -= 1;
        setQuestions('Please write "y" or "n"!');
      }
      break;

    case 4:
      index += 1;
      if (valid) {
        if (valid.includes('y')) {
          dublicate = true;
        } else {
          dublicate = false;
        }
        setQuestions();
      } else {
        index -= 1;
        setQuestions('Please write "y" or "n"!');
      }
      break;

    default:
      break;
  }
};

const questionaries = () => {
  setQuestions();

  return rl.on('line', line => {
    checkAnswers(line);
  });
};

const getOtions = () => ({
  openBrowser,
  images,
  download,
  count,
  dublicate
});
module.exports = { questionaries, getOtions, rl };
