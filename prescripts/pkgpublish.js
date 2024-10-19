import { writeFile } from 'fs';
const pkgfile = {
    "name": "@chenyfan/logger",
    "version": "0.0.0-"+new Date().getTime()
}
writeFile('./public/package.json', JSON.stringify(pkgfile), function (err) {
    if (err) {
        console.log(err);
    }
    console.log("Package.json file is created successfully.");
})