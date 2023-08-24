import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js"

class Move {
	constructor(move, evaluation, parentMove) {
		this.eval = evaluation;
		this.move = move;
		this.parentMove = parentMove;
		// this.pgn = pgn
	}
}
function evaluate(chess) {
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
			if (square != null) {
				if (square.color == turn) result -= pieceValues[square.type]
				else result += pieceValues[square.type]
			}
		})
	});
	if (chess.in_checkmate()) result = 10000;
	if (chess.in_draw()) result = 0;
	// if(chess.in_check()) result += 1;
	return result
}
function getBestMoveInCurrentDepth(fen, chess, parentMove) {
	const moves = evaluateMoves(fen, chess, parentMove, chess.moves());
	return moves.toSorted((a, b) => a.eval - b.eval).at(-1);
}
function evaluateMoves(fen, chess, parentMove, moves,) {
	for (let i = 0; i < moves.length; i++) {
		chess.move(moves[i]);
		moves[i] = new Move(moves[i], evaluate(chess), parentMove)
		chess.load(fen);
	}
	return moves;
	// return isOpponent ? moves.toSorted((a,b) => a.eval - b.eval).at(-1) : moves.toSorted((a,b) => a.eval - b.eval)[0];
}
function calculate(chess, depth) {
	let moves = [];
	// const beginningDepth = depth;
	function search(chess, depth, parentMove, isOpponent, myMoves, first) {
		const fen = chess.fen();
		console.log(isOpponent)
		if (depth <= 0) {
			// console.log("myMoves", myMoves)
			// const clonedMoves = searchedMoves.map(move => ({ move }));
			// for(let i = 0; i < clonedMoves.length; i++){
			// 	const move = clonedMoves[i];
			// 	move.parentMove = parentMove;
			// 	chess.move(move.move);
			// 	move.eval = (isOpponent ? -1 : 1) * evaluate(chess);
			// 	chess.load(fen);
			// }
			// console.log("am even i here?")
			if (isOpponent) {
				console.log("am i here?")
				moves.push(getBestMoveInCurrentDepth(fen, chess, parentMove));
				return
			} else {
				const pushMoves = myMoves.filter(x => x != 'ignore')
				moves.push(...pushMoves);
			}
			return;
		}
		if (isOpponent) {
			const bestMove = getBestMoveInCurrentDepth(fen, chess, parentMove);
			console.log(bestMove)
			chess.move(bestMove.move)
			/* console.log({
				"move": bestMove.move,
				"evaluation": bestMove.eval,
				"isOpponent": isOpponent,
				"depth": depth,
				parentMove
			}) */
			bestMove.eval *= -1
			search(chess, depth - 1, parentMove, false, [bestMove], false);
			chess.load(fen)
			return;
		}
		let bestEval = null;
		const searchMoves = chess.moves();

		for (let i = 0; i < searchMoves.length; i++) {
			const move = searchMoves[i];
			// if(move == 'Rxh5') debugger;
			chess.move(move);

			const evaluation = evaluate(chess);
			// const realEvaluation = isOpponent ? -evaluation : evaluation;
			const realEvaluation = evaluation

			if (realEvaluation > bestEval || bestEval === null) {
				bestEval = realEvaluation;
			}
			else if (realEvaluation < bestEval) {
				searchMoves[i] = 'ignore'
				continue;
			}
			/*console.log({
				"move": searchMoves[i],
				"evaluation": realEvaluation,
				"isOpponent": isOpponent,
				"depth": depth,
				parentMove
			})*/
			if (first) parentMove = move;
			searchMoves[i] = new Move(searchMoves[i], realEvaluation, parentMove)
			search(chess, depth - 1, parentMove, true, chess.moves(), false);
			chess.load(fen);
		}

		chess.load(fen);
	}

	search(chess, depth, null, false, chess.moves(), true);
	if (depth % 2 == 0) moves.sort((a, b) => b.eval - a.eval);
	else moves.sort((a, b) => a.eval - b.eval)
	// console.log("moves", moves)
	if (moves.length == 0) moves = [{ parentMove: chess.moves()[0] }]
	return moves[0];
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

// 		currentchess.load(fen);
// 		console.log(moves[i].eval)
// 	}
// 	return moves.toSorted((a, b) => b.eval - a.eval)[0]

// }
export { calculate, evaluate }