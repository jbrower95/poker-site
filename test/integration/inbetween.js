const clearDatabase = require('../db').clearDatabase;

module.exports = async () => {
  return new Promise(function (resolve, reject) {
    clearDatabase().then(resolve);
  });
}
