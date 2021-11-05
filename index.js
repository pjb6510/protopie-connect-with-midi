const easymidi = require('easymidi');
const io = require('socket.io-client');
const PianoPlayer = require('./pianoPlayer');

const pianoPlayer = new PianoPlayer();

const notesByNumber = {
  72: 'C5',
  71: 'B4',
  70: 'Bb4',
  69: 'A4',
  68: 'Ab4',
  67: 'G4',
  66: 'Gb4',
  65: 'F4',
  64: 'E4',
  63: 'Eb4',
  62: 'D4',
  61: 'Db4',
  60: 'C4',
  59: 'B3',
  58: 'Bb3',
  57: 'A3',
  56: 'Ab3',
  55: 'G3',
  54: 'Gb3',
  53: 'F3',
  52: 'E3',
  51: 'Eb3',
  50: 'D3',
  49: 'Db3',
  48: 'C3',
};

const handleMessageReceive = (data) => {
  try {
    if (!data.value) {
      return;
    }

    const isPress = data.value[0] === 'p';
    const note = notesByNumber[data.value.slice(1)];

    if (isPress) {
      pianoPlayer.play(note);
      console.log(note);
    }
  } catch (e) {
    console.error(e.toString());
  }
};

const connectSocket = (io, address) => {
  const socket = io(address, {
    reconnectionAttempts: 5,
    timeout: 1000 * 10,
  });

  socket
    .on('connect_error', (err) => {
      console.error('[SOCKETIO] disconnected, error', err.toString());
    })
    .on('connect_timeout', () => {
      console.error('[SOCKETIO] disconnected by timeout');
    })
    .on('reconnect_failed', () => {
      console.error('[SOCKETIO] disconnected by retry_timeout');
    })
    .on('reconnect_attempt', (count) => {
      console.error(
        `[SOCKETIO] Retry to connect #${count}, Please make sure ProtoPie Connect is running on ${address}`
      );
    })
    .on('connect', async () => {
      console.log('[SOCKETIO] connected to', address);
    })
    .on('disconnect', () => {
      console.log('[SOCKETIO] disconnected');
    })
    .on('ppMessage', handleMessageReceive);

  return socket;
};

const socket = connectSocket(io, 'http://localhost:9981');

const pianos = easymidi
  .getInputs()
  .filter((instrument) => instrument === 'Digital Piano');
const input = pianos[0] ? new easymidi.Input(pianos[0]) : null;

const handleNoteon = (message) => {
  console.log('noteon', message);

  const { note, velocity } = message;
  const isPress = velocity !== 0 ? 'p' : 'u';

  socket.emit('ppMessage', {
    messageId: 'noteon',
    value: `${isPress}${note}`,
  });
};

if (input) {
  console.log('connected to piano');
  input.on('noteon', handleNoteon);
} else {
  console.log('There is no connected piano. This app only receives messages.');
}
