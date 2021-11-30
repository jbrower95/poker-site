const setupLocalServer = require('../db').setupLocalServer;

module.exports = async () => {
  return new Promise(function (resolve, reject) {
    console.log('[INFO] Starting testing server...');
    setupLocalServer().then(() => {
      console.log('[INFO] Testing server OK.');
      resolve();
    });
  });
}
