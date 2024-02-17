// script.js
const fs = require('fs');
const Docxtemplater = require('docxtemplater');
const JSZip = require('jszip');
const { google } = require('googleapis');
const credentials = require('./nice-compass-413613-80a4fe413f66.json');

const processDocument = async (text) => {
    let downloadLink = '';


    const auth = await google.auth.getClient({
        credentials,
        scopes: 'https://www.googleapis.com/auth/drive.file',
    });

    const drive = google.drive({ version: 'v3', auth });

    const createAndSaveFileToDrive = async (outputPath, driveFolderId) => {

        const currentDate = new Date();
        const timestamp = currentDate.toISOString().replace(/[-T:.Z]/g, '');
        const randomString = Math.random().toString(36).substring(7);

        const fileMetadata = {
            name: `document_${timestamp}_${randomString}.pdf`,
            parents: [driveFolderId],
        };

        const media = {
            mimeType: 'application/pdf',
            body: fs.createReadStream(outputPath),
        };

        try {
            const response = await drive.files.create({
                requestBody: fileMetadata,
                media,
            });

            const fileId = response.data.id;
            downloadLink = `https://drive.google.com/file/d/${fileId}/view`;
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการบันทึกไฟล์ใน Google Drive:', error.message);
        }
    };

    const processDataAndSaveToFile = (data, outputPath) => {
        const doc = new Docxtemplater();
        doc.loadZip(new JSZip(fs.readFileSync(__dirname + '/template.docx', 'binary')));
        console.log('data : ' + data);
        doc.setData(data);
        doc.render();

        try {
            const buf = doc.getZip().generate({ type: 'nodebuffer' });
            fs.writeFileSync(outputPath, buf);
            console.log('ไฟล์ถูกสร้างเรียบร้อยแล้ว:', outputPath);
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการบันทึกไฟล์:', error.message);
        }
    };

    const data = {
        date: text.date,
        unit1: text.unit1[0],
        unit2: text.unit1[1],
        unit3: (text.unit2 || [])[0],
        unit4: (text.unit2 || [])[1],
        unit5: (text.unit3 || [])[0],
        unit6: (text.unit3 || [])[1],
        checkin: text.checkin,
        checkout: text.checkout,
        groupname: text.groupname,
        total: text.total,
    };

    const outputPath = '/tmp/document.docx';

    await processDataAndSaveToFile(data, outputPath);

    const driveFolderId = '1yJ4YF-pB3zhsbpX0qgRmW56eqQjYgwO0';
    await createAndSaveFileToDrive(outputPath, driveFolderId);

    return downloadLink;

};

module.exports = processDocument;