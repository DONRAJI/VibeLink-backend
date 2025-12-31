const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// 방 만들기
router.post('/create', async (req, res) => {
    const { roomName, hostId, mode } = req.body;

    try {
        // 1000 ~ 9999 랜덤 숫자 생성
        let roomCode = Math.floor(1000 + Math.random() * 9000).toString();

        // 혹시 모를 중복 방지 (간단 체크)
        const existing = await Room.findOne({ roomCode });
        if (existing) {
            roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        }

        const newRoom = new Room({
            roomName,
            hostId,
            roomCode, // ✨ 여기서 roomCode가 잘 들어가는지 확인
            mode: mode || 'Jukebox',
            queue: []
        });

        await newRoom.save();
        res.json(newRoom);

    } catch (error) {
        console.error('Create Room Error:', error);
        // 에러가 나면 500을 보내서 프론트가 알게 함
        res.status(500).json({ error: 'Duplicate room code or DB error' });
    }
});

// 방 정보 가져오기 (GET /api/room/:roomId)
router.get('/:roomId', async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId);
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.json(room);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;