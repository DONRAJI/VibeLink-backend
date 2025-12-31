const express = require('express');
const router = express.Router();
const User = require('../models/User');

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

module.exports = router;
