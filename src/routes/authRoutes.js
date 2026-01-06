const express = require('express');
const router = express.Router();
const User = require('../models/User');
const axios = require('axios'); // ✨ 추가 필요

const JWT_SECRET = process.env.JWT_SECRET;
const SOCIAL_REDIRECT_URI = process.env.SOCIAL_REDIRECT_URI; // https://vibelink.test/callback

// ✅ 1. 이메일 중복 확인 API (추가됨)
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: '이메일을 입력해주세요.' });

        const user = await User.findOne({ email });
        if (user) {
            console.log('이미 사용 중인 이메일입니다.');
            return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' }); // 409 Conflict
        }

        res.json({ message: '사용 가능한 이메일입니다.' });
    } catch (err) {
        console.error('Email Check Error:', err);
        console.log('서버오류가 발생했습니다.');
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// ✅ 2. 회원가입 API (수정됨: 닉네임 저장)
router.post('/signup', async (req, res) => {
    try {
        const { email, password, nickname } = req.body;

        // 백엔드 측 유효성 검사
        if (!email || !password || !nickname) {
            return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
        }

        // 중복 가입 방지
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
        }

        // 유저 생성 (User 모델에 nickname 필드가 이미 정의되어 있어야 함)
        const newUser = new User({ email, password, nickname });
        await newUser.save();

        res.status(201).json({
            message: 'User created successfully',
            user: { id: newUser._id, email: newUser.email, nickname: newUser.nickname }
        });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: '아이디 또는 비밀번호가 틀렸습니다.' });

        res.json({
            message: 'Login successful',
            token: 'mock-jwt-token-123',
            user: { id: user._id, email: user.email, nickname: user.nickname }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
        console.log(err);
    }
});

router.post('/kakao', async (req, res) => {
    const { code } = req.body;
    try {
        // 1. 인가 코드로 토큰 받기
        const tokenRes = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.KAKAO_CLIENT_ID,
                redirect_uri: SOCIAL_REDIRECT_URI,
                code
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const { access_token } = tokenRes.data;

        // 2. 토큰으로 유저 정보 받기
        const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const kakaoAccount = userRes.data.kakao_account;
        const email = kakaoAccount.email || `kakao_${userRes.data.id}@vibelink.com`; // 이메일 없을 경우 가짜 이메일 생성
        const nickname = kakaoAccount.profile.nickname;
        const profileImage = kakaoAccount.profile.profile_image_url;

        // 3. 로그인 또는 회원가입 처리
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                nickname,
                password: await bcrypt.hash(Math.random().toString(36), 10), // 랜덤 비번
                profileImage,
                provider: 'kakao' // 소셜 가입 구분용 필드 (Schema에 없으면 무시됨)
            });
            await user.save();
        }

        // 4. JWT 토큰 발급
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user });

    } catch (error) {
        console.error('Kakao Login Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Kakao login failed' });
    }
});

module.exports = router;
