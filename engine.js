// TODO: implement PV;
import book from './book.json' assert {type: 'json'};
function countIsolatedPawns(chess, side) {
	const board = chess.board();
	let isolatedPawns = 0;
	let iKnowLastRowWasEmpty = false;
	for (let j = 0; j < board.length; j++) {
		let fileHasPawn = false;
		for (let i = 0; i < board[j].length; i++) {
			if (fileHasPawn) break;
			const sqaure = board[i][j];
			if (sqaure && sqaure.type == 'p' && sqaure.color == side) fileHasPawn = true;
		}
		if (fileHasPawn) {
			let lastRowEmpty = j == 0 ? true : false,
				nextRowEmpty = true;
			if (iKnowLastRowWasEmpty) {
				iKnowLastRowWasEmpty = false;
				lastRowEmpty = true;
			}
			for (let i = 0; i < board[j].length; i++) {
				if (!nextRowEmpty) break;
				const sqaure = board[i]?.[j + 1];
				if (sqaure && sqaure.type == 'p' && sqaure.color == side) nextRowEmpty = false;
			}
			if (nextRowEmpty) {
				j++;
				iKnowLastRowWasEmpty = true;
				if (lastRowEmpty) isolatedPawns++;
			}
		}
		else {
			iKnowLastRowWasEmpty = true;
		}
	}
	return isolatedPawns
}
const zobristKeys = [];
const pieceValues = {
	n: 3,
	b: 3,
	p: 1,
	r: 5,
	q: 9,
	k: 0
}
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

function quiescenceSearch(alpha, beta, chess, plMoves, engineSide, color, isDepthOdd) {
	const moves = chess.moves();
	// console.log()
	const stand_pat = color * evaluate(chess, plMoves, engineSide, isDepthOdd);
	if (stand_pat >= beta) return beta;
	if (alpha < stand_pat) alpha = stand_pat
	let captures = moves.filter(x => x.includes('x'));
	if (captures.length == 0) return alpha;
	for (const capture of captures) {
		// const newplMoves = chess.moves();
		chess.move(capture);
		let score = -quiescenceSearch(-beta, -alpha, chess, moves, engineSide, -color)
		chess.undo();
		if (score >= beta) return beta;
		if (alpha < score) alpha = score;
	}
	return alpha
}
function squareToNumber(sqaure) {
	return (sqaure.charCodeAt(0) - 97) + (8 - (+sqaure[1])) * 8 // 97 is the char code for a
}

function countDoubledPawns(chess, side) {
	const board = chess.board();
	let doubledPawns = 0;
	for (let j = 0; j < board.length; j++) {
		let pawnsPerFile = 0;
		for (let i = 0; i < board[j].length; i++) {
			const square = board[i][j];
			if (square?.type == 'p' && square.color == side) pawnsPerFile++;
		}
		doubledPawns += (pawnsPerFile === 1) ? 0 : pawnsPerFile;
	}
	return doubledPawns
}
// static exchange evaluation
function see(chess, moves, square) {
	let value = 0;
	let captures = moves.filter(x => x.captured && x.to === square);
	if (!captures.length) return 0;
	captures.sort((a, b) => pieceValues[a.type] - pieceValues[b.type])
	const lowestCapture = captures[0];
	chess.move(lowestCapture);
	value = Math.max(0, pieceValues[lowestCapture.captured] - see(chess, chess.moves(), square));
	chess.undo();
	return value;
}
function updateZobristKey(zobristKey, move) {
	let result = zobristKey
	if (move.flags.includes('k')) {
		const kingFile = move.color == 'w' ? 7 : 0;
		result ^= zobristKeys[kingFile * 8 + 4][move.color + 'k'] // remove king from the e file
			^ zobristKeys[kingFile * 8 + 6][move.color + 'k'] // put the king in the g file
			^ zobristKeys[kingFile * 8 + 7][move.color + 'r'] // remove rook from the h file
			^ zobristKeys[kingFile * 8 + 5][move.color + 'r'] // put the rook in the f file
		return result;
	}
	if (move.flags.includes('q')) {
		const kingFile = move.color == 'w' ? 7 : 0;
		result ^= zobristKeys[kingFile * 8 + 4][move.color + 'k'] // remove king from the e file
			^ zobristKeys[kingFile * 8 + 2][move.color + 'k'] // put the king in the c file
			^ zobristKeys[kingFile * 8 + 0][move.color + 'r'] // remove rook from the a file
			^ zobristKeys[kingFile * 8 + 5][move.color + 'r'] // put the rook in the d file
		return result;
	}
	result ^= zobristKeys[squareToNumber(move.from)][move.color + move.piece]
		^ zobristKeys[squareToNumber(move.to)][move.color + (move.promotion || move.piece)];
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
function evaluate(chess, plMoves, engineSide, isDepthOdd) {
	let result = 0;
	const otherSide = engineSide == 'w' ? 'b' : 'w'
	const board = chess.board();
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[i].length; j++) {
			const square = board[i][j];
			if (square != null) {
				if (square.color == engineSide) result -= pieceValues[square.type]
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
	if (plMoves?.length) result += isDepthOdd ? (chess.moves().length - plMoves.length) * 0.01 : (plMoves.length - chess.moves().length) * 0.01
	if (engineSide == 'w') {
		result -= (countDoubledPawns(chess, engineSide) - countDoubledPawns(chess, otherSide)) * 0.05
			+ (countIsolatedPawns(chess, engineSide) - countIsolatedPawns(chess, otherSide)) * 0.05
	}
	else {
		result -= (countDoubledPawns(chess, otherSide) - countDoubledPawns(chess, engineSide)) * 0.05
			+ (countIsolatedPawns(chess, otherSide) - countIsolatedPawns(chess, engineSide)) * 0.05
	}

	// if(chess.in_check()) result += 1;
	return result
}
function evaluateMove(chess, move, engineSide, isDepthOdd) {
	let result;
	const plMoves = chess.moves();
	chess.move(move);
	result = evaluate(chess, plMoves, engineSide, isDepthOdd);
	chess.undo();
	return result;
}


function calculate(chess, depth) {
	let bookMove = book[chess.fen()];
	if (bookMove) {
		if (bookMove instanceof Array) return bookMove[Math.floor(Math.random() * bookMove.length)]
		return bookMove
	};
	let moves = chess.moves({ verbose: true });
	let engineSide = chess.turn();
	let bestMove = null;
	let isDepthOdd = depth % 2 == 1;

	let bestScore = -Infinity;
	let transpositionTable = Object.create(null);
	function pvSearch(chess, depth, alpha, beta, color, plMoves, zobristKey, isDepthOdd) {

		if (depth == 0) {
			return quiescenceSearch(alpha, beta, chess, plMoves, engineSide, color, isDepthOdd)
		}
		// if(!zobristKey) zobristKey = getZobristKey(chess);
		if (zobristKey in transpositionTable) {
			console.log('trans table hit')
			return transpositionTable[zobristKey];
		}

		const searchMoves = chess.moves({ verbose: true });
		// TODO: add killer moves in move ordering
		// Applies move ordering (captures/promotions > quiet moves)

		searchMoves.sort((a, b) => {
			// Compare the 'captured' property
			if ((a.captured && !b.captured) || (a.promotion && !b.promotion)) {
				return -1; // 'a' should come before 'b'
			}
			if (!a.captured && b.captured || (!a.promotion && b.promotion)) {
				return 1; // 'b' should come before 'a'
			}
			return see(chess, searchMoves, b.to) - see(chess, searchMoves, a.to); // sort by highest SEE
		});
		let bSearchPv = true
		for (let i = 0; i < searchMoves.length; i++) {
			const move = searchMoves[i];
			chess.move(move);
			zobristKey = updateZobristKey(zobristKey, move)
			let score;
			if (bSearchPv) {
				score = -pvSearch(chess, depth - 1, -beta, -alpha, -color, searchMoves, zobristKey, isDepthOdd);
			} else {
				score = -pvSearch(chess, depth - 1, -alpha - 1, -alpha, -color, searchMoves, zobristKey, isDepthOdd); // search in null window
				if (score > alpha) {
					score = -pvSearch(chess, depth - 1, -beta, -alpha, -color, searchMoves, zobristKey, isDepthOdd); // research
				}
			}
			chess.undo();
			zobristKey = updateZobristKey(zobristKey, move)
			if (score >= beta) {
				// beta cut-off
				return beta
			}
			if (score > alpha) {
				alpha = score;
				bSearchPv = false;
				// update the PV here
			}
			// alpha = Math.max(alpha, score);
		}
		// chess.undo()
		if(bSearchPv) transpositionTable[zobristKey] = alpha;
		return alpha;
	}
	function negamax(chess, depth, alpha, beta, color, plMoves, zobristKey, isDepthOdd) {

		if (depth == 0) {
			return quiescenceSearch(alpha, beta, chess, plMoves, engineSide, color, isDepthOdd)
		}
		// if(!zobristKey) zobristKey = getZobristKey(chess);
		if (zobristKey in transpositionTable) {
			console.log('trans table hit')
			return transpositionTable[zobristKey];
		}

		const searchMoves = chess.moves({ verbose: true });
		// TODO: add killer moves in move ordering
		// Applies move ordering (captures/promotions > quiet moves)

		searchMoves.sort((a, b) => {
			// Compare the 'captured' property
			if ((a.captured && !b.captured) || (a.promotion && !b.promotion)) {
				return -1; // 'a' should come before 'b'
			}
			if (!a.captured && b.captured || (!a.promotion && b.promotion)) {
				return 1; // 'b' should come before 'a'
			}
			return see(chess, searchMoves, b.to) - see(chess, searchMoves, a.to); // sort by highest SEE
		});

		for (let i = 0; i < searchMoves.length; i++) {
			const move = searchMoves[i];
			chess.move(move);
			zobristKey = updateZobristKey(zobristKey, move)
			const score = -negamax(chess, depth - 1, -beta, -alpha, -color, searchMoves, zobristKey, isDepthOdd)
			chess.undo()
			zobristKey = updateZobristKey(zobristKey, move)
			if (score >= beta) {
				// beta cut-off
				return beta
			}
			if (score > alpha) {
				alpha = score;
				// update the PV here
			}
			// alpha = Math.max(alpha, score);
		}
		// chess.undo()
		transpositionTable[zobristKey] = alpha;
		return alpha;
	}
	// for (let i = 0; i < moves.length; i++) {
	// 	moves[i].evaluation = evaluateMove(chess, moves[i], engineSide, isDepthOdd);
	// }
	moves.sort((a, b) => {
		// Compare the 'captured' property
		if ((a.captured && !b.captured) || (a.promotion && !b.promotion)) {
			return -1; // 'a' should come before 'b'
		}
		if (!a.captured && b.captured || (!a.promotion && b.promotion)) {
			return 1; // 'b' should come before 'a'
		}
		return see(chess, moves, b.to) - see(chess, moves, a.to) /* || b.evaluation - a.evaluation */; // sort by highest SEE
	});
	for (let i = 0; i < moves.length; i++) {
		const move = moves[i];
		chess.move(move);
		const score = -negamax(chess, depth - 1, -Infinity, Infinity, 1, [], getZobristKey(chess), isDepthOdd)
		chess.undo();
		if (score > bestScore) {
			bestScore = score;
			bestMove = move
		}
	}
	console.log(`eval: ${bestScore}`)
	return bestMove;
}
export { calculate, countDoubledPawns, countIsolatedPawns }
