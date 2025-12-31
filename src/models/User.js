const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }, // TODO: Add Hashing
    nickname: {
        type: String,
        default: 'Viber'
    },
    isPremium: { type: Boolean, default: false }, // 스포티파이 연동 여부
    profileImage: { type: String, default: '' },
    // Spotify Integration
    spotifyAccessToken: { type: String },
    spotifyRefreshToken: { type: String },
    spotifyTokenExpiry: { type: Date }, // 토큰 만료 시간

    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('User', userSchema);
