const checkDate = (historyTime) => {
  return Date.now() - historyTime * 60000;
};

const filterHistory = (value) => {
  const date = checkDate(1.4);
  return value > date;
};
var count = 0;
var c = Date.now();
setInterval(() => {
  console.log(c, (Date.now() - c) / 1000 / 60, count++, filterHistory(c));
}, 1000);
