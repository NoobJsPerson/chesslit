import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js"
function evaluate(chess){
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
	board.forEach(rank => {
		rank.forEach(square => {
			if(square != null) {
				if(square.color == turn) result -= pieceValues[square.type]
				else result += pieceValues[square.type]
			}
		})
	});
	if(chess.in_checkmate()) result = Infinity
	if(chess.in_draw()) result = 0;
	// if(chess.in_check()) result += 1;
	return result
}
function calculate(fen, depth){
	const currentchess = new Chess(fen);
	const moves = currentchess.moves()
	for(let i = 0; i < moves.length; i++) {
		currentchess.move(moves[i]);
		const currentfen = currentchess.fen()
		const enemyMoves = currentchess.moves()
		for(let j = 0; j < enemyMoves.length; j++){
			currentchess.move(enemyMoves[j])
			enemyMoves[j] = -1 * evaluate(currentchess)
			currentchess.load(currentfen)
		}
		moves[i] = {
			move: moves[i],
			eval: Math.min(...enemyMoves)
		}
		currentchess.load(fen);
		console.log(moves[i].eval)
	}
	return moves.toSorted((a, b) => b.eval - a.eval)[0]
	
}
export {calculate, evaluate}