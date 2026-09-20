const fs = require('fs');
const vm = require('vm');
const path = require('path');
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
for (const file of ['config.js','finance.js','market.js','events.js','replay.js','tests.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), { filename: file });
}
const report = TimeMarket.Tests.run();
for (const result of report.results) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
if (!report.pass) process.exitCode = 1;
