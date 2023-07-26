const fs = require('fs');
const pkgfile = {
    "name": "cyanblog",
    "version": new Date().getTime()
}
fs.writeFile('./public/package.json', JSON.stringify(pkgfile), function (err) {
    if (err) {
        console.log(err);
    }
    console.log("Package.json file is created successfully.");
})