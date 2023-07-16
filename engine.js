import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js"

class Move {
	constructor(move, evaluation, parentMove){
		this.eval = evaluation;
		this.move = move;
		this.parentMove = parentMove;
	}
}
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
	if(chess.in_checkmate()) result = 10000;
	if(chess.in_draw()) result = 0;
	// if(chess.in_check()) result += 1;
	return result
}
function getBestMoveInCurrentDepth(fen, chess, isOpponent){
	const moves = chess.moves()
	for(let i = 0; i < moves.length;i++){
		chess.move(moves[i]);
		moves[i] = new Move(moves[i], evaluate(chess))
		chess.load(fen);
	}
	return isOpponent ? moves.toSorted((a,b) => a.eval - b.eval).at(-1) : moves.toSorted((a,b) => a.eval - b.eval)[0];
}
// function calculate(chess, depth, parentMove, isOpponent, bestEval){
// 	if(depth < 0) return;
// 	console.log(parentMove)
// 	let result;
// 	const moves = chess.moves();
// 	const fen = chess.fen();
// 	// let bestEval = null;
// 	for(let i = 0; i < moves.length;i++){
// 		if(!chess.in_checkmate()) chess.move(moves[i]);
// 		// console.log("IS CHECKMATE: " + chess.in_checkmate())
// 		const evaluation = evaluate(chess);
// 		const realEvaluation = isOpponent ? -evaluation : evaluation;
// 		if(realEvaluation > bestEval || bestEval === null) {
// 			bestEval = realEvaluation;
// 			if(parentMove)parentMove.eval = realEvaluation
// 		}
// 		else if (realEvaluation < bestEval) {
// 			// moves[i].parentMove.eval = realEvaluation
// 			if(parentMove) parentMove.eval = realEvaluation
// 			continue;
// 		}

// 		moves[i] = new Move(moves[i], realEvaluation, parentMove);
// 		if(!moves[i].parentMove) moves[i].parentMove = moves[i];
// 		moves[i].parentMove.eval = realEvaluation
// 		// parentMove = moves[i].parentMove;
// 		// if(parentMove) parentMove.eval = realEvaluation;
// 		const possibleResult = calculate(chess, depth - 1, moves[i].parentMove, !isOpponent, bestEval);
// 		if(possibleResult ===  null) {
// 			console.log(possibleResult)
// 		}
// 		if(possibleResult && possibleResult.eval >= bestEval) result = possibleResult
// 		chess.load(fen);
// 	}
// 	chess.load(fen);
// 	return result || parentMove;
// }
function calculate(fen, depth){
	const currentchess = new Chess(fen);
	const moves = currentchess.moves()
	for(let i = 0; i < moves.length; i++) {
		currentchess.move(moves[i]);
		const currentfen = currentchess.fen()
		const enemyMoves = currentchess.moves()
		for(let j = 0; j < enemyMoves.length; j++){
			currentchess.move(enemyMoves[j])
			// enemyMoves[j] = new Move(enemyMoves[j],-1 * evaluate(currentchess));
			// if(!currentchess.in_checkmate() || !currentchess.in_draw()) enemyMoves[j] = getBestMoveInCurrentDepth(currentchess.fen(), currentchess);
			if(currentchess.in_checkmate()) enemyMoves[j] = new Move(null, -Infinity);
			else if(currentchess.in_draw()) enemyMoves[j] = new Move(null, 0);
			else enemyMoves[j] = getBestMoveInCurrentDepth(currentchess.fen(), currentchess);
			currentchess.load(currentfen)
		}
		moves[i] = {
			move: moves[i],
			eval: Math.min(...(enemyMoves.map(x => x.eval)))
		}

		currentchess.load(fen);
		console.log(moves[i].eval)
	}
	return moves.toSorted((a, b) => b.eval - a.eval)[0]
	
}
export {calculate, evaluate}