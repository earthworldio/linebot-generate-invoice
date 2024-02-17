const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios').default;
const dotenv = require('dotenv');


const env = dotenv.config().parsed;
const app = express(); // Use express() to create an instance of Express

const processDocument = require('./script')

const LineConfig = {
    channelAccessToken: env.ACCESS_TOKEN,
    channelSecret: env.SECRET_TOKEN
};

const client = new line.Client(LineConfig)

app.post('/webhook', line.middleware(LineConfig), async (req, res) => {
    try {
        const events = req.body.events;
        handleEvent(events[0])
    } catch (error) {
        res.status(500).end();
    }
});

const handleEvent = async (event) => {
    try {
        console.log('message : ' + event.message.text);
        const data = createJSON(event.message.text);
        const downloadLink = await processDocument(data);
        return client.replyMessage(event.replyToken, { type: 'text', text: `${downloadLink}` });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการประมวลผลเอกสาร:', error);
        return client.replyMessage(event.replyToken, { type: 'text', text: 'Process failed' });
    }
};

const createJSON = (input) => {

    function parseUnit(unitText) {
        const matches = unitText.match(/\[(.*),(.*)\]/);
        if (matches) {
            const unitNumber = matches[1].trim();
            const unitType = matches[2].trim();
            return [unitNumber, unitType];
        }
        return ['', ''];
    }

    function parseLineText(lineText) {
        const lines = lineText.split('\n');

        const data = {
            date: lines[0].trim(),
            unit1: parseUnit(lines[1]),
            unit2: parseUnit(lines[2]),
            unit3: parseUnit(lines[3]),
            checkin: lines[4].split(': ')[1].trim(),
            checkout: lines[5].split(': ')[1].trim(),
            groupname: lines[6].split(': ')[1].trim(),
            total: parseInt(lines[7].split(': ')[1].trim()),
        };

        return data;
    }

    const jsonData = parseLineText(input);

    return jsonData
}

const port = 4000;

app.listen(port, () => {
    console.log(`Server is listening on port : ${port}`);
});