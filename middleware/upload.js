const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true }); // ✅ ensure nested folders too
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const extname = path.extname(file.originalname);
        const originalName = file.originalname.replace(extname, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${originalName}-${uniqueSuffix}${extname}`;
        cb(null, filename);
    }
});

const upload = multer({ storage });

module.exports = upload;