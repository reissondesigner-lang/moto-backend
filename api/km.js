import axios from "axios";
import CryptoJS from "crypto-js";

export default async function handler(req, res) {
  // ===== CORS CONFIG =====
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://reissondesigner-lang.github.io"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: true, message: "Method not allowed" });
  }

  try {
    // ===== ENV VARIABLES =====
    const account = process.env.PROTRACK_USER;
    const password = process.env.PROTRACK_PASS;
    const imei = process.env.PROTRACK_IMEI;

    if (!account || !password || !imei) {
      return res.status(500).json({
        error: true,
        message: "Missing environment variables"
      });
    }

    // ===== GENERATE SIGNATURE =====
    const time = Math.floor(Date.now() / 1000).toString();
    const md5Password = CryptoJS.MD5(password).toString();
    const signature = CryptoJS.MD5(md5Password + time).toString();

    // ===== AUTH REQUEST =====
    const authResponse = await axios.get(
      `https://api.protrack365.com/api/authorization`,
      {
        params: {
          time: time,
          account: account,
          signature: signature
        }
      }
    );

    if (
      !authResponse.data ||
      !authResponse.data.record ||
      !authResponse.data.record.access_token
    ) {
      return res.status(200).json({
        error: true,
        stage: "authorization",
        details: authResponse.data
      });
    }

    const token = authResponse.data.record.access_token;

    // ===== DEVICE STATUS REQUEST =====
    const statusResponse = await axios.get(
      `https://api.protrack365.com/api/device/status`,
      {
        params: {
          access_token: token,
          imeis: imei
        }
      }
    );

    if (
      !statusResponse.data ||
      !statusResponse.data.record ||
      !statusResponse.data.record[0] ||
      typeof statusResponse.data.record[0].mileage === "undefined"
    ) {
      return res.status(200).json({
        error: true,
        stage: "device_status",
        details: statusResponse.data
      });
    }

    const mileage = statusResponse.data.record[0].mileage;

    // ===== SUCCESS RESPONSE =====
    return res.status(200).json({
      km: Number(mileage)
    });

  } catch (error) {
    return res.status(200).json({
      error: true,
      stage: "exception",
      details: error.response?.data || error.message
    });
  }
}
