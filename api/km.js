import axios from "axios";
import CryptoJS from "crypto-js";

export default async function handler(req, res) {
  try {
    const account = "reisson1";
    const password = "7654321";
    const imei = "354778341733114";

    const time = Math.floor(Date.now() / 1000).toString();

    const md5Pass = CryptoJS.MD5(password).toString();
    const signature = CryptoJS.MD5(md5Pass + time).toString();

    const authUrl = `https://api.protrack365.com/api/authorization?time=${time}&account=${account}&signature=${signature}`;

    const authResponse = await axios.get(authUrl);
    const token = authResponse.data.record.access_token;

    const statusUrl = `https://api.protrack365.com/api/device/status?access_token=${token}&imeis=${imei}`;
    const statusResponse = await axios.get(statusUrl);

    const mileage = statusResponse.data.record[0].mileage;

    res.status(200).json({ km: mileage });

  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar KM" });
  }
}
