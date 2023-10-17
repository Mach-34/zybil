import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv'
import express from 'express';
dotenv.config()
import { getPlatformOauthURL, getVerifiedData } from './controllers/platform.js';

const app = express();

app.use(bodyParser.json());
app.use(cors())

// app.get('/url', (req, res) => {
//     const { platform } = req.query;
//     const url = getPlatformOauthURL(platform);
//     res.status(200).send(url);
// })

// app.post('/verify', async (req, res) => {
//     try {
//         const { code, platform } = req.body;
//         const verifiedData = await getVerifiedData(platform, code);
//         res.status(200).send(verifiedData)
//     } catch(err) {
//         res.status(500).send(err)
//     }
// })


app.listen(8000, () => {
    console.log('Server started on http://localhost:8000');
});