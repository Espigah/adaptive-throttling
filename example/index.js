//const { createAdaptiveThrottling } = require('adaptive-throttling');
const { createAdaptiveThrottling } = require('../lib/index.js');
const axios = require('axios');

const adaptiveThrottling = createAdaptiveThrottling();
let interval = 0;

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const sucessCase = () => {
  adaptiveThrottling
    .execute(() => {
      return Promise.resolve('ok');
    })
    .then((response) => {
      console.log('response', response);
    })
    .catch((error) => {
      console.log('error', error.message);
    });
};

const failCase = () => {
  adaptiveThrottling
    .execute(() => {
      return axios.get('/user?ID=12345');
    })
    .then((response) => {
      console.log('response', response.data);
    })
    .catch((error) => {
      console.log('error', error.message);
    });
};

const getUser = () => {
  interval++;
  console.log('interval', interval);
  if ((interval >= 0 && interval < 101) || interval > 2009) {
    sucessCase();
  }
  if (interval >= 100 && interval < 2009) {
    failCase();
  }
  setTimeout(getUser, randomIntFromInterval(200, 50));
};

setTimeout(getUser, randomIntFromInterval(1000, 200));
