module.exports = (total, req, res) => {
    const range = req.headers['range'];
    if (!range) { return { code: 200 }; }

    const sizes = range.match(/bytes=(\d*)-(\d*)/);
    let end = sizes[2] || total - 1;
    let start = sizes[1] || total - end;

    if (start > end || start < 0 || end > total) { return { code: 200 } }
    
    res.setHearder("Accept-Ranges", "bytes");
    res.setHearder("Content-Range", `bytes ${start}-${end}/${total}`)
    res.setHearder("Content-Length", end - start)
    return {
        code: 206,
        start: +start,
        end: +end
    }

}