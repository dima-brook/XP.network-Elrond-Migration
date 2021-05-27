import express from 'express';
import * as socket from './socket';

const port = 8000;

const app = express();
const io = socket.socketMain();

app.post('/newevent', (req, res) => {
    const id = BigInt(req.header("id"));

    io.emit("elrond:emitted_event", id.toString());
    res.send('{"status": "ok"}')
});

app.listen(port, () => console.log("Express Server is up!"))