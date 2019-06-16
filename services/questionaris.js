const readLine = require('readline');

const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>> '
});

let openBrowser, images, download, count, duplicate, filterByDate, date;
let index = 0;

const questions = [
  'Open browser? (y/n) ',
  'Load images in browser? (y/n) ',
  'Count articles you need to scrape, default 10?  ',
  'Would you like to download images? (y/n) ',
  'Would you like to create duplicate images on different articles? (y/n) ',
  `Would you like to scrape by date? ('y/n)`
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
          duplicate = true;
        } else {
          duplicate = false;
        }
        setQuestions();
      } else {
        index -= 1;
        setQuestions('Please write "y" or "n"!');
      }
      break;

    case 5:
      index += 1;

      if (valid) {
        if (valid.includes('y')) {
          filterByDate = true;
          questions.push('Write date like pattern "YYYY/MM/DD"');
        } else {
          filterByDate = false;
        }
        setQuestions();
      } else {
        index -= 1;
        setQuestions('Please write "y" or "n"!');
      }
      break;

    case 6:
      index += 1;

      const regexDate = /^\d{4}\/\d{2}\/\d{2}$/g
      if (regexDate.test(answer)) {
        date = answer;
        setQuestions();
      } else {
        index -= 1;
        setQuestions('Please correct date YYYY/MM/DD ');
      }
      break;

    default:
      setQuestions();
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
  duplicate,
  date,
  filterByDate
});
module.exports = { questionaries, getOtions, rl };
