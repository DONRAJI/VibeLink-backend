const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    title: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tracks: [], // 유튜브, 스포티파이 노래 객체들이 섞여서 저장됨
    coverImage: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Playlist', playlistSchema);