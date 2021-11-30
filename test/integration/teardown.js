const child_process = require('child_process');

module.exports = async (done) => {
  const command = 'make';
  const args = [
    'reset'
  ];
  const options = {
    shell: true,
    cwd: process.cwd()
  };

  const proc = child_process.spawn(
    command,
    args,
    options,
  );

  proc.stdout.on('data', (data) => {
    console.log(`cleanup: ${data}`);
  });
  proc.stderr.on('data', (data) => {
    console.log(`cleanup: ${data}`);
  });

  // need a little delay out here while this proc
  return new Promise((resolve, reject) => {
    proc.on('exit', resolve);
  });
}
