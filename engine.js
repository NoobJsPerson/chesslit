const zobristKeys = [];
for (let i = 1; i <= 64; i++) {
	zobristKeys.push({
		wk: Math.floor(Math.random() * 2 ** 32),
		bk: Math.floor(Math.random() * 2 ** 32),
		bp: Math.floor(Math.random() * 2 ** 32),
		wp: Math.floor(Math.random() * 2 ** 32),
		wr: Math.floor(Math.random() * 2 ** 32),
		br: Math.floor(Math.random() * 2 ** 32),
		wn: Math.floor(Math.random() * 2 ** 32),
		bn: Math.floor(Math.random() * 2 ** 32),
		wq: Math.floor(Math.random() * 2 ** 32),
		bq: Math.floor(Math.random() * 2 ** 32),
		bb: Math.floor(Math.random() * 2 ** 32),
		wb: Math.floor(Math.random() * 2 ** 32)
	})
}
function squareToNumber(sqaure) {
	return (sqaure.charCodeAt(0) - 97) + (8 - (+sqaure[1])) * 8 // 97 is the char code for a
}
function updateZobristKey(zobristKey, move) {
	let result = zobristKey
	if (move.flags.includes('k')) {
		const kingFile = move.color == 'w' ? 7 : 0;
		result ^= zobristKeys[kingFile * 8 + 4][move.color + 'k'] // remove king from the e file
		result ^= zobristKeys[kingFile * 8 + 6][move.color + 'k'] // put the king in the g file
		result ^= zobristKeys[kingFile * 8 + 7][move.color + 'r'] // remove rook from the h file
		result ^= zobristKeys[kingFile * 8 + 5][move.color + 'r'] // put the rook in the f file
		return result;
	}
	if (move.flags.includes('q')) {
		const kingFile = move.color == 'w' ? 7 : 0;
		result ^= zobristKeys[kingFile * 8 + 4][move.color + 'k'] // remove king from the e file
		result ^= zobristKeys[kingFile * 8 + 2][move.color + 'k'] // put the king in the c file
		result ^= zobristKeys[kingFile * 8 + 0][move.color + 'r'] // remove rook from the a file
		result ^= zobristKeys[kingFile * 8 + 5][move.color + 'r'] // put the rook in the d file
		return result;
	}
	if (zobristKeys[squareToNumber(move.to)] === undefined) console.log('Square: ', move.to, ' Value: ', squareToNumber(move.to))
	result ^= zobristKeys[squareToNumber(move.from)][move.color + move.piece] ^ zobristKeys[squareToNumber(move.to)][move.color + (move.promotion || move.piece)];
	if (move.captured) {
		const oppositeColor = move.color == 'w' ? 'b' : 'w'
		let enPassantOffset = (oppositeColor == "b" ? 1 : -1) * (move.flags.includes('e') ? 8 : 0);
		result ^= zobristKeys[squareToNumber(move.to) + enPassantOffset][oppositeColor + (move.promotion || move.captured)];
	}

	return result
}
function getZobristKey(chess) {
	const keys = [];
	const board = chess.board();
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[i].length; j++) {
			const square = board[i][j];
			if (square != null) {
				keys.push(zobristKeys[i * 8 + j][square.color + square.type])
			}
		}
	}
	return keys.reduce((xored, toxor) => xored ^ toxor)
}
window.getZobristKey = getZobristKey
function evaluate(chess, plMoves) {
	let result = 0;
	const pieceValues = {
		n: 3,
		b: 3,
		p: 1,
		r: 5,
		q: 9,
		k: 0
	}
	const board = chess.board();
	const turn = chess.turn();
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[i].length; j++) {
			const square = board[i][j];
			if (square != null) {
				if (square.color == turn) result -= pieceValues[square.type]
				else result += pieceValues[square.type]
			}
		}
	}
	// board.forEach(rank => {
	// 	rank.forEach(square => {
	// 		if (square != null) {
	// 			if (square.color == turn) result -= pieceValues[square.type]
	// 			else result += pieceValues[square.type]
	// 		}
	// 	})
	// });
	if (chess.in_checkmate()) result = 10000;
	if (chess.in_draw()) result = 0;
	if (plMoves?.length) result += (plMoves.length - chess.moves().length) * 0.1

	// const lastMove = chess.history({verbose: true});

	// if(chess.in_check()) result += 1;
	return result
}


function calculate(chess, depth) {
	let moves = chess.moves();
	let bestMove = null;
	let bestScore = -Infinity
	let transpositionTable = Object.create(null);
	// const beginningDepth = depth;
	function negamax(chess, depth, alpha, beta, color, plMoves, zobristKey) {

		if (depth == 0) {
			return color * evaluate(chess, plMoves);
		}
		// if(!zobristKey) zobristKey = getZobristKey(chess);
		if (zobristKey in transpositionTable) return transpositionTable[zobristKey];
		let bestScore = -Infinity;
		const searchMoves = chess.moves({ verbose: true });

		for (let i = 0; i < searchMoves.length; i++) {
			const move = searchMoves[i];
			chess.move(move);
			zobristKey = updateZobristKey(zobristKey, move)
			const score = -negamax(chess, depth - 1, -beta, -alpha, -color, searchMoves, zobristKey)
			chess.undo()
			zobristKey = updateZobristKey(zobristKey, move)
			bestScore = Math.max(score, bestScore);
			alpha = Math.max(alpha, score);
			if (alpha >= beta) break;
		}
		// chess.undo()
		transpositionTable[zobristKey] = bestMove;
		return bestScore;
	}

	for (let i = 0; i < moves.length; i++) {
		const move = moves[i];
		chess.move(move);
		const score = -negamax(chess, depth - 1, -Infinity, Infinity, 1, [], getZobristKey(chess))
		chess.undo();
		if (score > bestScore) {
			bestScore = score;
			bestMove = move
		}
	}
	return bestMove;
}
export { calculate, evaluate }
