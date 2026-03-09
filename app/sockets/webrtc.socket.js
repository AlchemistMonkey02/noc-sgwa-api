/**
 * WebRTC Socket Handler for In-App Consultations
 */

const activeUsers = new Map();  // userId -> roomId
const activeRooms = new Map();  // roomId -> Set of socketIds (tracks who is in the room)
const notifiedRooms = new Set(); // rooms already notified so we don't spam officers

const stream = (socket) => {
    // ─── Register User on Connect ───────────────────────────────
    socket.on('register', (data) => {
        if (data.userId) {
            socket.userId = data.userId;
            socket.userType = data.userType || 'APPLICANT';
            console.log(`[WebRTC Socket] User ${socket.userId} registered on socket ${socket.id}`);
        }
    });

    // ─── Incoming Call Invite ───────────────────────────────────
    socket.on('call_invite', async (data) => {
        try {
            console.log(`[WebRTC Socket] call_invite received from ${data.callerRole} to app ${data.applicationNumber}`);
            // Lazy load the model so we don't break socket initialization
            const NOCApplication = require('../noc/noc-application.model');
            const targetApp = await NOCApplication.findOne({
                $or: [
                    { applicationNumber: { $regex: new RegExp(`^${data.applicationNumber}$`, 'i') } },
                    { trackingId: { $regex: new RegExp(`^${data.applicationNumber}$`, 'i') } },
                    // Sometimes they use completely different formats, fallback exact match:
                    { applicationNumber: data.applicationNumber }
                ]
            });

            console.log(`[WebRTC Socket] targetApp found?`, !!targetApp, targetApp ? `UserId expected: ${targetApp.userId}` : 'Will broadcast');

            // Format payload
            const payload = {
                room: data.room,
                callerId: data.callerId,
                callerName: data.callerName || 'Unknown',
                callerRole: data.callerRole || '',
                callerType: data.callerType || 'APPLICANT', // 'APPLICANT' | 'OFFICER'
                officerType: data.officerType || '',
                applicationNumber: data.applicationNumber || '',
            };

            if (data.callerType === 'OFFICER') {
                // Officer is calling Applicant -> Send specifically to Applicant
                if (targetApp && targetApp.userId) {
                    const applicantId = targetApp.userId.toString();
                    payload.recipientId = applicantId;

                    let emitCount = 0;
                    console.log(`[WebRTC] Looking for applicant socket with user id: ${applicantId}. Total sockets connected: ${socket.nsp.sockets.size}`);
                    // We must find the socket for this user
                    for (const [sid, sok] of socket.nsp.sockets) {
                        console.log(`   -> checking socket ${sid}, sok.userId: ${sok.userId}, sok.userType: ${sok.userType}`);
                        if (sok.userId === applicantId && sid !== socket.id) {
                            sok.emit('call_invite', payload);
                            emitCount++;
                        }
                    }
                    console.log(`[WebRTC] Emitted to ${emitCount} sockets for applicant.`);

                    if (emitCount === 0) {
                        console.warn(`[WebRTC] Applicant socket not found directly. Broadcasting with recipientId fallback!`);
                        socket.broadcast.emit('call_invite', payload);
                    }
                } else {
                    // Fallback to broadcast if DB lookup fails to prevent breaking
                    console.warn(`[WebRTC] Target App not found or missing userId. Broadcasting!`);
                    socket.broadcast.emit('call_invite', payload);
                }
            } else {
                // Applicant is calling Officer -> Send to any connected officer
                for (const [sid, sok] of socket.nsp.sockets) {
                    // We can identify officers if sok.userType === 'OFFICER' or similar. 
                    // Let's just broadcast to everyone EXCEPT the sender since applicants calling
                    // officers is more of a generalized queue right now.
                    if (sid !== socket.id) {
                        sok.emit('call_invite', payload);
                    }
                }
            }
        } catch (err) {
            console.error('[WebRTC Socket] Error processing call_invite:', err);
            socket.broadcast.emit('call_invite', data); // ultimate fallback
        }
    });

    // Emitted by the recipient to inform the caller their invite was declined
    socket.on('call_invite_declined', (data) => {
        socket.broadcast.emit('call_invite_declined', {
            room: data.room,
            declinedBy: data.declinedBy || 'User',
        });
    });

    socket.on('subscribe', (data) => {
        const userId = data.userId;
        const room = data.room;
        socket.displayName = data.name || 'User';

        if (userId) {
            socket.userId = userId;
            socket.room = room;
            activeUsers.set(userId, room);
        }

        const socketsInRoom = socket.adapter.rooms.get(room);
        const roomSize = socketsInRoom?.size || 0;

        // ── Case 1: This exact socket is already in the room (re-subscription due to effect re-run)
        // Just refresh presence — no room_full check needed, no new_user broadcast.
        if (socketsInRoom && socketsInRoom.has(socket.id)) {
            console.log(`[Socket Trace] Same socket ${socket.id} re-subscribed to room ${room} (already present, skipping re-entry)`);
            // Refresh existing users list for them
            const existingUsers = {};
            for (const sid of activeRooms.get(room) || []) {
                if (sid !== socket.id) {
                    const s = socket.nsp.sockets.get(sid);
                    existingUsers[sid] = s?.displayName || 'User';
                }
            }
            socket.emit('room_users', existingUsers);
            return;
        }

        // ── Case 2: A DIFFERENT socket for the same user is in the room (e.g., tab refresh)
        // Kick the old socket out and allow this new one in.
        let kickedCount = 0;
        if (socketsInRoom) {
            for (const sid of socketsInRoom) {
                const s = socket.nsp.sockets.get(sid);
                if (s && s.userId === userId && sid !== socket.id) {
                    console.log(`[Socket Trace] Re-entry: kicking stale socket ${sid} for user ${userId}`);
                    s.emit('already_on_call', { room, replaced: true });
                    s.leave(room);
                    if (activeRooms.has(room)) activeRooms.get(room).delete(sid);
                    kickedCount++;
                }
            }
        }

        // ── Case 3: Room is full with OTHER users
        const effectiveRoomSize = roomSize - kickedCount;
        if (effectiveRoomSize >= 2) {
            console.log(`[Socket Trace] Room ${room} is full (${effectiveRoomSize} users). Rejecting ${socket.id}`);
            socket.emit('room_full', { room });
            return;
        }

        // ── Join the room
        socket.join(room);
        socket.join(socket.id);

        if (!activeRooms.has(room)) activeRooms.set(room, new Set());
        activeRooms.get(room).add(socket.id);

        // Tell the joining user who is already in the room
        const existingUsers = {};
        for (const sid of activeRooms.get(room)) {
            if (sid !== socket.id) {
                const s = socket.nsp.sockets.get(sid);
                existingUsers[sid] = s?.displayName || 'User';
            }
        }
        socket.emit('room_users', existingUsers);

        // Tell existing users about this new participant
        socket.to(room).emit('new_user', { socketId: socket.id, name: socket.displayName });
    });

    // Explicit end call for immediate cleanup
    socket.on('end_call', (data) => {
        const room = data.room || socket.room;
        console.log(`[Socket Trace] Explicit end_call emitted with data room: ${data.room} | Fallback room: ${socket.room} | Socket ID: ${socket.id}`);

        if (room) {
            // Tell everyone in the room it's over
            socket.to(room).emit('peer_disconnected', socket.id);

            // Clean up all data for this room instantly
            const roomSockets = activeRooms.get(room);
            if (roomSockets) {
                for (const sid of roomSockets) {
                    const s = socket.nsp.sockets.get(sid);
                    if (s) {
                        s.leave(room);
                        if (s.userId) activeUsers.delete(s.userId);
                    }
                }
            }
            activeRooms.delete(room);
            notifiedRooms.delete(room);
        }
    });

    socket.on('newUserStart', (data) => {
        socket.to(data.to).emit('newUserStart', { sender: data.sender, name: socket.displayName });
    });

    socket.on('sdp', (data) => {
        socket.to(data.to).emit('sdp', { description: data.description, sender: data.sender, name: socket.displayName });
    });

    socket.on('ice candidates', (data) => {
        socket.to(data.to).emit('ice candidates', { candidate: data.candidate, sender: data.sender });
    });

    socket.on('chat', (data) => {
        socket.to(data.room).emit('chat', { sender: data.sender, msg: data.msg });
    });

    socket.on('leave', (data) => {
        const room = data.room || socket.room;
        if (room) {
            socket.to(room).emit('peer_disconnected');
            socket.leave(room);

            notifiedRooms.delete(room);
            const roomSet = activeRooms.get(room);
            if (roomSet) {
                roomSet.delete(socket.id);
                if (roomSet.size === 0) activeRooms.delete(room);
            }
        }
        if (socket.userId) activeUsers.delete(socket.userId);
    });

    // --- Synchronized Recording ---
    // When one participant clicks Record, broadcast to the whole room so everyone starts simultaneously
    socket.on('start_recording', () => {
        socket.to(socket.room).emit('peer_start_recording', { initiator: socket.displayName });
    });

    socket.on('stop_recording', () => {
        socket.to(socket.room).emit('peer_stop_recording', { initiator: socket.displayName });
    });

    // Notify peers when video is toggled on/off
    socket.on('video_state', (data) => {
        socket.to(socket.room).emit('peer_video_state', {
            socketId: socket.id,
            enabled: data.enabled,
            name: socket.displayName
        });
    });

    // Notify peers when audio is toggled on/off
    socket.on('audio_state', (data) => {
        socket.to(socket.room).emit('peer_audio_state', {
            socketId: socket.id,
            enabled: data.enabled,
            name: socket.displayName
        });
    });

    // Notify peers when screen sharing starts or stops
    socket.on('screen_share_state', (data) => {
        socket.to(socket.room).emit('peer_screen_share_state', {
            socketId: socket.id,
            sharing: data.sharing,
            name: socket.displayName,
        });
    });

    socket.on('disconnect', () => {
        // Notify remaining peers
        if (socket.room) {
            socket.to(socket.room).emit('peer_disconnected');

            // Clean up room tracking
            notifiedRooms.delete(socket.room); // reset so next session triggers notification again
            const roomSet = activeRooms.get(socket.room);
            if (roomSet) {
                roomSet.delete(socket.id);
                if (roomSet.size === 0) activeRooms.delete(socket.room);
            }
        }

        if (socket.userId && activeUsers.get(socket.userId) === socket.room) {
            activeUsers.delete(socket.userId);
        }
    });
};

module.exports = stream;
