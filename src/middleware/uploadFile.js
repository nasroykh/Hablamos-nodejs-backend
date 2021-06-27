const multer = require('multer');

const upload = multer({
    limits: {
        fileSize: 2000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload a valid image, supported extensions are : .jpg/.jpeg/.png'))
        }

        cb(undefined, true);
    }
});

module.exports = upload;