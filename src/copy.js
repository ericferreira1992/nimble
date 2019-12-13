let cpx = require('cpx');

cpx.copy('./package.json', 'dist');
cpx.copy('./src/style.scss', 'dist');
cpx.copy('./src/scss/*.scss', 'dist/scss');
cpx.copy('../README.md', 'dist');