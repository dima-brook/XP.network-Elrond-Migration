import express from 'express';
import cors from 'cors';
import * as socket from './socket';

const port = 6644;

const app = express();
const io = socket.socketMain();

app.post('/event/transfer', (req, res) => {
    const id = BigInt(req.header("id"));

    io.emit("elrond:transfer_event", id.toString());
    res.send('{"status": "ok"}')
});

console.log("WARN: using permissive cors!!")

app.use(cors())

app.listen(port, () => console.log("Express Server is up!"))
