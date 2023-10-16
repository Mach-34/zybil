import axios from 'axios';
import { constructURLSearchParams } from '../utils/index.js';
import dotenv from 'dotenv';
dotenv.config()

const {
    DISCORD_CLIENT_ID,
    DISCORD_REDIRECT_URI,
    DISCORD_SECRET,
} = process.env;

export const getDiscordAccessToken = async (code) => {
    const paramObj = {
        grant_type: 'authorization_code',
        code: code,
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_SECRET,
        redirect_uri: DISCORD_REDIRECT_URI
    }
    const params = constructURLSearchParams(paramObj);
    const { data } = await axios.post('https://discord.com/api/oauth2/token', params);
    return data.access_token
}

export const getDiscordOauthURL = () => {
    const paramObj = {
        response_type: 'code',
        scope: 'identify',
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: DISCORD_REDIRECT_URI
    }
    const params = constructURLSearchParams(paramObj);
    const baseUrl = 'https://discord.com/oauth2/authorize';
    return `${baseUrl}?${params}`
}

const verify = async (accessToken) => {
    const { data } = await axios.get("https://discord.com/api/oauth2/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const verified = {
        platform: 3,
        record: {
            id: data.user?.id,
        },
        valid: data.user?.id ? true : false
    }
    return verified
}

export const verifyDiscord = async (code) => {
    const accessToken = await getDiscordAccessToken(code);
    return await verify(accessToken);
}