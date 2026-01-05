const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');

// 내 플레이리스트 목록 가져오기
router.get('/my', async (req, res) => {
    const { userId } = req.query;
    try {
        const playlists = await Playlist.find({ owner: userId }).sort({ createdAt: -1 });
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch playlists' });
    }
});

// (추후 '만들기' 기능에서 사용) 플레이리스트 생성
router.post('/create', async (req, res) => {
    const { title, userId, coverImage } = req.body;
    try {
        const newPlaylist = new Playlist({ title, owner: userId, coverImage });
        await newPlaylist.save();
        res.json(newPlaylist);
    } catch (error) {
        res.status(500).json({ error: 'Creation failed' });
    }
});

// 플레이리스트 상세 정보 가져오기
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        res.json(playlist);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// 노래 추가하기 (복수 추가 지원)
router.post('/:id/add', async (req, res) => {
    const { tracks } = req.body; // tracks는 배열이어야 함 []
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });

        // 기존 트랙 뒤에 새 트랙들 추가
        // (배열인지 확인 후 처리)
        const newTracks = Array.isArray(tracks) ? tracks : [tracks];
        playlist.tracks.push(...newTracks);

        // 썸네일이 없으면 첫 번째 곡의 썸네일로 설정
        if (!playlist.coverImage && newTracks.length > 0) {
            playlist.coverImage = newTracks[0].thumbnail;
        }

        await playlist.save();
        res.json(playlist);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add tracks' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await Playlist.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;