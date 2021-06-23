const multer = require('multer');

const upload = multer({
    limits: {
        fileSize: 2000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload a valid image'))
        }

        cb(undefined, true);
    }
});

module.exports = upload;