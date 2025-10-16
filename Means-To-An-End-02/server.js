import net from 'net'
import { Buffer } from 'node:buffer';

const PORT = 8002;

class Client {
	constructor(addr, timestamp, socket) {
		this.address = addr
		this.addedAt = timestamp
		this.messages = []
		this.buffer = Buffer.alloc(0)
		this.evaluated = -1
		this.socket = socket
	}

	addData(data) {
		// Ensure data is a Buffer
		if (!Buffer.isBuffer(data)) {
			data = Buffer.from(data);
		}

		// Append new data to the buffer
		this.buffer = Buffer.concat([this.buffer, data]);

		console.log(this.buffer.length)
		// Example: assume messages are prefixed by a 9-byte header
		while (this.buffer.length >= 9) {
			const message = this.buffer.subarray(0, 9);
			this.buffer = this.buffer.subarray(9);

			const type = message.subarray(0, 1).toString()
			const first = message.subarray(1, 5).readInt32BE()
			const second = message.subarray(5, 9).readInt32BE()

			console.log(type, first, second, this.buffer.length)

			if (type === "I") {
				this.messages.push({ time: first, cost: second })
			} else if (type === "Q") {
				let cost = 0, count = 0
				for (let x of this.messages) {
					if (x.time >= first && x.time <= second) {
						cost += x.cost
						count++
					}
				}
				let res = count > 0 ? cost / count : 0
				console.log(res)
				const buf = Buffer.alloc(4);
				buf.writeInt32BE(res, 0);
				this.socket.write(buf)
			} else {
				console.log("invalid : ", type)
				return false
			}
		}
	}
}


const server = net.createServer((socket) => {
	console.log("new client connection event", socket.address())
	let c = new Client(socket.address(), Date.now(), socket)
	socket.on('data', (data) => {
		console.log(data.toString())
		let res = c.addData(data)
		if (res === false) {
			socket.destroy()
		}

	})
	socket.on('close', () => {
		console.log('Client disconnected');
		// Clean up client resources
		c = null;
	});
})

server.listen(PORT, '0.0.0.0')

