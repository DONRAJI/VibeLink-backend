const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI; // 예: exp://192.168.x.x:8081
console.log('--- Debugging Redirect URI ---');
console.log('Expected:', 'https://vibelink.test/callback');
console.log('Actual:', process.env.SPOTIFY_REDIRECT_URI);
console.log('Length:', process.env.SPOTIFY_REDIRECT_URI ? process.env.SPOTIFY_REDIRECT_URI.length : 'undefined');
console.log('----------------------------');

// 1. [교환] 프론트에서 받은 Code -> Access Token & Refresh Token
router.post('/exchange', async (req, res) => {
    const { code, userId } = req.body;

    try {
        // 스포티파이에 토큰 요청
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);

        const response = await axios.post('https://accounts.spotify.com/api/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token, expires_in } = response.data;

        // DB에 저장
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

        await User.findByIdAndUpdate(userId, {
            isPremium: true,
            spotifyAccessToken: access_token,
            spotifyRefreshToken: refresh_token,
            spotifyTokenExpiry: expiryDate
        });

        res.json({ accessToken: access_token, refreshToken: refresh_token });

    } catch (error) {
        console.error('Spotify Auth Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to exchange token' });
    }
});

// 2. [갱신] Refresh Token -> New Access Token
router.post('/refresh', async (req, res) => {
    const { userId } = req.body; // 혹은 JWT 미들웨어에서 추출

    try {
        const user = await User.findById(userId);
        if (!user || !user.spotifyRefreshToken) {
            return res.status(401).json({ error: 'No refresh token available' });
        }

        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', user.spotifyRefreshToken);
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);

        const response = await axios.post('https://accounts.spotify.com/api/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, expires_in } = response.data;

        // 새 토큰으로 DB 업데이트 (Refresh Token은 그대로일 수 있음)
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

        await User.findByIdAndUpdate(userId, {
            spotifyAccessToken: access_token,
            spotifyTokenExpiry: expiryDate
        });

        res.json({ accessToken: access_token });

    } catch (error) {
        console.error('Spotify Refresh Error:', error.response?.data || error.message);
        res.status(401).json({ error: 'Failed to refresh token' });
    }
});

module.exports = router;