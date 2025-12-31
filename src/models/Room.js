const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomName: { type: String, required: true },
    hostId: { type: String, required: true },

    // ✨ [중요] 필드명을 roomCode로 명시하고 unique: true 설정
    roomCode: { type: String, required: true, unique: true },

    mode: { type: String, default: 'Jukebox' },

    // 큐 (노래 목록)
    queue: [{
        id: String,
        title: String,
        artist: String,
        thumbnail: String,
        uri: String,
        source: String,
        addedBy: String
    }],

    // 현재 재생 곡 (시작 시간 포함)
    currentTrack: {
        id: String,
        title: String,
        artist: String,
        thumbnail: String,
        uri: String,
        source: String,
        duration: Number,
        startedAt: { type: Number, default: 0 }
    },

    createdAt: { type: Date, default: Date.now, expires: 86400 } // 24시간 후 자동 삭제
});

module.exports = mongoose.model('Room', roomSchema);