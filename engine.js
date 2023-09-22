import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js"

class Move {
	constructor(move, evaluation, parentMove) {
		this.eval = evaluation;
		this.move = move;
		this.parentMove = parentMove;
		// this.line = ''
		// this.pgn = pgn
	}
}
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
	result += (plMoves.length - chess.moves().length) * 0.1

	// const lastMove = chess.history({verbose: true});

	// if(chess.in_check()) result += 1;
	return result
}


function calculate(chess, depth) {
	let moves = chess.moves();
	let bestMove = null;
	let bestScore = -Infinity
	// const beginningDepth = depth;
	function negamax(chess, depth, alpha, beta, color, plMoves) {

		if (depth == 0) {
			return color * evaluate(chess, plMoves);
		}
		let bestScore = -Infinity;
		const searchMoves = chess.moves();

		for (let i = 0; i < searchMoves.length; i++) {
			const move = searchMoves[i];
			chess.move(move);
			const score = -negamax(chess, depth - 1, -beta, -alpha, -color, searchMoves)
			chess.undo()
			bestScore = Math.max(score, bestScore);
			alpha = Math.max(alpha, score);
			if (alpha >= beta) break;
		}
		// chess.undo()
		return bestScore;
	}

	for (let i = 0; i < moves.length; i++) {
		const move = moves[i];
		chess.move(move);
		const score = -negamax(chess, depth - 1, -Infinity, Infinity, 1)
		chess.undo();
		if (score > bestScore) {
			bestScore = score;
			bestMove = move
		}
	}
	return bestMove;
}

// function calculate(fen, depth){
// 	const currentchess = new Chess(fen);
// 	const moves = currentchess.moves()
// 	for(let i = 0; i < moves.length; i++) {
// 		currentchess.move(moves[i]);
// 		const currentfen = currentchess.fen()
// 		const enemyMoves = currentchess.moves()
// 		for(let j = 0; j < enemyMoves.length; j++){
// 			currentchess.move(enemyMoves[j])
// 			// enemyMoves[j] = new Move(enemyMoves[j],-1 * evaluate(currentchess));
// 			// if(!currentchess.in_checkmate() || !currentchess.in_draw()) enemyMoves[j] = getBestMoveInCurrentDepth(currentchess.fen(), currentchess);
// 			if(currentchess.in_checkmate()) enemyMoves[j] = new Move(null, -Infinity);
// 			else if(currentchess.in_draw()) enemyMoves[j] = new Move(null, 0);
// 			else enemyMoves[j] = getBestMoveInCurrentDepth(currentchess.fen(), currentchess);
// 			currentchess.load(currentfen)
// 		}
// 		moves[i] = {
// 			move: moves[i],
// 			eval: Math.min(...(enemyMoves.map(x => x.eval)))
// 		}

// 		currentchess.undo()
// 		console.log(moves[i].eval)
// 	}
// 	return moves.toSorted((a, b) => b.eval - a.eval)[0]

// }
export { calculate, evaluate }