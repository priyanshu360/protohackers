import net from 'net';


const PORT = 8002;

const server = net.createServer((socket) => {
	// console.log("new client connection event", socket.address())
	socket.addListener('data', (data) => {
		// console.log(data.toString())
		socket.write(data)
	})
})

server.listen(PORT, '0.0.0.0')

