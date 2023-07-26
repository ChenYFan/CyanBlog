const fs = require('fs');
const pkgfile = {
    "name": "cyanblog",
    "version": new Date().getTime()
}
fs.writeFile('./public/package.json')
console.log('Pre Publish Done!')