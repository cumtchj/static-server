const http = require("http");
const path = require("path")
const fs = require('fs');
const promisify = require('util').promisify;
const chalk = require("chalk");
const Handlebars = require("handlebars");
const conf = require("./config");
const getMime = require("./helpers/mime");
const compress = require("./helpers/compress");
const range = require("./helpers/range");
const isFresh = require("./helpers/cache");
const openUrl = require("./helpers/open")




const stat = promisify(fs.stat), readdir = promisify(fs.readdir);

const tplPath = path.join(__dirname, "./templates/dir.tpl")
const source = fs.readFileSync(tplPath);
const template = Handlebars.compile(source.toString())


class Server {
    constructor(config) {
        this.conf = Object.assign({}, conf, config)
    }

    start() {
        const app = http.createServer((req, res) => {
            const filePath = path.join(this.conf.root, req.url);
            console.log(filePath)
            stat(filePath).then(stat => {
                //文件
                if (stat.isFile()) {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", getMime(filePath));
                    if (isFresh(stat, req, res)) {
                        res.statusCode = 304;
                        res.end();
                        return;
                    }
                    let rs;
                    const { code, start, end } = range(stat.size, req, res)
                    if (code === 200) {
                        rs = fs.createReadStream(filePath)
                    } else {
                        rs = fs.createReadStream(filePath, { start, end })

                    }
                    if (filePath.match(this.conf.compress)) {
                        compress(rs, req, res).pipe(res);
                    } else {
                        rs.pipe(res);
                    }

                    return;
                }
                //文件夹
                if (stat.isDirectory()) {
                    readdir(filePath).then(files => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "text/html");
                        const data = {
                            files,
                            dir: path.relative(this.conf.root, filePath),
                            title: path.basename(filePath)
                        }
                        res.end(template(data))
                        // res.write(`<h1>${new Date()}</h1>`)
                        // res.end(`<h4>${files.map(item => "<a>" + item + "</a>").join("<br/>")}</h4>`);
                    }).catch(err => {
                        res.end(err)
                    })

                }
            }).catch(err => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html");
                res.write(`<h1>${new Date()}</h1>`)
                res.write(`<h4>${filePath} is not a valid path!</h4>`)
                console.log(err.toString())
                res.end();
            })

        });

        app.listen(this.conf.port, this.conf.host, () => {
            const addr = `http://${this.conf.host}:${this.conf.port}`
            console.info(`
    
    ${chalk.yellow("Congratulations！")}

    Server started at ${chalk.green(addr)}
    
    `)
            openUrl(addr)
        })
    }
}

module.exports = Server

