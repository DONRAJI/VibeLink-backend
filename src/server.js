require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const spotifyRoutes = require('./routes/spotifyRoutes');
const Room = require('./models/Room');
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for mobile app
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/spotify', spotifyRoutes);
app.use('/api/playlist', require('./routes/playlistRoutes'));
app.use('/api/room', require('./routes/roomRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
// Database Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in .env');
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// Basic Routes
app.get('/', (req, res) => {
    res.send('VibeLink Backend is running. DB Status: ' + mongoose.connection.readyState);
    console.log('VibeLink Backend is running. DB Status: ' + mongoose.connection.readyState);
});

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. 방 입장 (Join)
    socket.on('joinRoom', async ({ roomId, userNickname }) => {
        socket.join(roomId);
        console.log(`${userNickname} joined room ${roomId}`);

        // 현재 방 상태(큐)를 입장한 유저에게 전송
        try {
            const room = await Room.findById(roomId);
            if (room) {
                socket.emit('updateRoom', room);
            }
        } catch (e) { console.error(e); }
    });

    // 2. 노래 추가 (Add Track)
    socket.on('addTrack', async ({ roomId, track }) => {
        try {
            const room = await Room.findById(roomId);
            if (room) {
                // 큐에 추가
                room.queue.push(track);

                // 만약 현재 재생 중인 곡이 없다면, 바로 재생
                if (!room.currentTrack) {
                    room.currentTrack = track;
                    room.currentTrack.startedAt = Date.now();
                    room.queue.shift(); // 큐에서 제거
                }

                await room.save();

                // 방에 있는 모든 사람에게 업데이트 알림
                io.to(roomId).emit('updateRoom', room);
            }
        } catch (e) { console.error(e); }
    });

    // 3. 곡이 끝남 (Next Track - 방장이 호출)
    socket.on('trackEnded', async ({ roomId }) => {
        try {
            const room = await Room.findById(roomId);
            if (room && room.queue.length > 0) {
                room.currentTrack = room.queue.shift(); // 다음 곡 꺼내기
                await room.save();
                io.to(roomId).emit('updateRoom', room);
            } else if (room) {
                room.currentTrack = null;
                await room.save();
                io.to(roomId).emit('updateRoom', room);
            }
        } catch (e) { console.error(e); }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
