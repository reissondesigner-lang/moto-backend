// api/km.js
import axios from "axios";
import CryptoJS from "crypto-js";

export default async function handler(req, res) {
  try {
    const account = process.env.PROTRACK_USER;
    const password = process.env.PROTRACK_PASS;
    const imei = process.env.PROTRACK_IMEI;

    const time = Math.floor(Date.now() / 1000).toString();
    const md5Pass = CryptoJS.MD5(password).toString();
    const signature = CryptoJS.MD5(md5Pass + time).toString();

    const authUrl = `https://api.protrack365.com/api/authorization?time=${time}&account=${account}&signature=${signature}`;
    const auth = await axios.get(authUrl);

if (!auth.data || !auth.data.record || !auth.data.record.access_token) {
  return res.json(auth.data);
}

const token = auth.data.record.access_token;

    const statusUrl = `https://api.protrack365.com/api/device/status?access_token=${token}&imeis=${imei}`;
    const status = await axios.get(statusUrl);

    const mileage = status.data.record[0].mileage;

    res.status(200).json({ km: mileage });

  }catch (err) {
  console.log("ERRO COMPLETO:", err.response?.data || err.message);
  res.status(200).json({ error: true, details: err.response?.data || err.message });
}
}
