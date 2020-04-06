const path = require("path");
const mime = require("mime");


const mimeMap = {

}

module.exports = (file) => {
    let ext = path.extname(file).split(".").pop().toLowerCase();
    if (!ext) {
        ext = file
    }
    return mime.getType(ext) || mime.getType("txt")
};