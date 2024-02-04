import { writeFile } from 'fs';
const pkgfile = {
    "name": "cyanacc-panel",
    "version": "0.0.0-" + new Date().getTime()
}
writeFile('./dist/package.json', JSON.stringify(pkgfile), function (err) {
    if (err) {
        console.log(err);
    }
    console.log("Package.json file is created successfully.");
})