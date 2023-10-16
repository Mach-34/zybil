import axios from "axios";
import { constructURLSearchParams } from "../utils/index.js";
import dotenv from 'dotenv'
dotenv.config()

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_REDIRECT_URI,
    GOOGLE_SECRET
} = process.env

export const getGoogleOauthURL = () => {
    const paramObj = {
        redirect_uri: GOOGLE_REDIRECT_URI,
        prompt: 'consent',
        response_type: 'code',
        client_id: GOOGLE_CLIENT_ID,
        // Encoding incorrectly
        // scope: 'email+profile',
        access_type: 'offline',
    }
    const params = constructURLSearchParams(paramObj);
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
    return `${baseUrl}?${params}&scope=email+profile`
}

const getGoogleAccessToken = async (code) => {
    const paramObj = {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI
    }
    const params = constructURLSearchParams(paramObj);
    const baseUrl = 'https://oauth2.googleapis.com/token'
    const { data: { access_token } } = await axios.post(`${baseUrl}?${params}`);
    return access_token;
}

const verify = async (accessToken) => {
    const { data } = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const { email, verified_email } = data;
    const verified = {
        platform: 2,
        record: {
            email,
        },
        valid: verified_email,
    }
    return verified
}

export const verifyGoogle = async (code) => {
    const accessToken = await getGoogleAccessToken(code);
    return await verify(accessToken);
}