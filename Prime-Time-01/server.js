const net = require('net');

function isPrime(n) {
	if ((typeof n !== 'number') ||
		(!Number.isFinite(n)) ||
		(!Number.isInteger(n)) ||
		(n < 2)) {
		return false;
	}


	// 2 is prime
	if (n === 2) {
		return true;
	}

	// Even numbers are not prime
	if (n % 2 === 0) {
		return false;
	}

	// Check odd divisors up to sqrt(n)
	const sqrt = Math.sqrt(n);
	for (let i = 3; i <= sqrt; i += 2) {
		if (n % i === 0) {
			return false;
		}
	}

	return true;
}

function handleRequest(line) {
	try {
		const request = JSON.parse(line);

		// Validate request is an object
		if (typeof request !== 'object' || request === null || Array.isArray(request)) {
			return { malformed: true };
		}

		// Check required fields
		if (!('method' in request)) {
			return { malformed: true };
		}

		if (request.method !== 'isPrime') {
			return { malformed: true };
		}

		if (!('number' in request)) {
			return { malformed: true };
		}

		// Check that number is actually a number type
		if (typeof request.number !== 'number') {
			return { malformed: true };
		}

		// Valid request - compute response
		const prime = isPrime(request.number);
		return {
			malformed: false,
			response: { method: 'isPrime', prime: prime }
		};

	} catch (e) {
		// JSON parse error or other error
		return { malformed: true };
	}
}

function handleClient(socket) {
	console.log('Client connected:', socket.remoteAddress);

	let buffer = '';

	socket.on('data', (data) => {
		buffer += data.toString('utf-8');

		// Process all complete lines
		let newlineIndex;
		while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
			const line = buffer.substring(0, newlineIndex);
			buffer = buffer.substring(newlineIndex + 1);

			const result = handleRequest(line);

			if (result.malformed) {
				// Send malformed response and disconnect
				socket.write('malformed\n');
				socket.end();
				return;
			} else {
				// Send correct response
				socket.write(JSON.stringify(result.response) + '\n');
			}
		}
	});

	socket.on('end', () => {
		console.log('Client disconnected');
	});

	socket.on('error', (err) => {
		console.error('Socket error:', err.message);
	});
}

// Create TCP server
const server = net.createServer(handleClient);

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
	console.log(`Prime Time server listening on port ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
	console.error('Server error:', err);
});
