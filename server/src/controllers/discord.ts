import "dotenv/config";
import { constructURLSearchParams } from "../utils/index.js";

const {
    DISCORD_CLIENT_ID,
    DISCORD_REDIRECT_URI,
    DISCORD_SECRET,
} = process.env;

export const getDiscordAccessToken = async (code: string) => {
    const params = {
        grant_type: "authorization_code",
        code,
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_SECRET,
        redirect_uri: DISCORD_REDIRECT_URI
    }
    const res = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        body: constructURLSearchParams(params)
    });
    if (res.status !== 200) {
        throw new Error("Discord access token not received");
    }
    const data = await res.json();
    return data.access_token;
}

export const getDiscordOauthURL = () => {
    const params = constructURLSearchParams({
        response_type: "code",
        scope: "identify",
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: DISCORD_REDIRECT_URI
    });
    const baseUrl = "https://discord.com/oauth2/authorize";
    return `${baseUrl}?${params}`;
}

const verify = async (accessToken: string) => {
    const res = await fetch("https://discord.com/api/oauth2/@me", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status !== 200) {
        throw new Error("Discord access token not received");
    }
    const data = await res.json();
    return {
        platform: 3,
        record: { id: data.user?.id },
        valid: data.user?.id ? true : false
    }
}

export const verifyDiscord = async (code: string) => {
    const accessToken = await getDiscordAccessToken(code);
    return await verify(accessToken);
}