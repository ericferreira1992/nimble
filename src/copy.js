let cpx = require('cpx');

cpx.copy('./package.json', 'dist');
cpx.copy('../README.md', 'dist');