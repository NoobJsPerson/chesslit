import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js"
import { INPUT_EVENT_TYPE, COLOR, Chessboard, BORDER_TYPE } from "./cm-chessboard/Chessboard.js"
import { MARKER_TYPE, Markers } from "./cm-chessboard/extensions/markers/Markers.js"
import { PromotionDialog } from "./cm-chessboard/extensions/promotion-dialog/PromotionDialog.js"
import { Accessibility } from "./cm-chessboard/extensions/accessibility/Accessibility.js"
import { FEN } from "./cm-chessboard/model/Position.js"



import { calculate, countDoubledPawns, countIsolatedPawns } from "./engine.js"


const chess = new Chess()
let depth = 3;
const depthInput = document.getElementById('depth-input');
const pgnSpan = document.getElementById('pgn-span');
depthInput.value = depth
depthInput.onchange = () => {
	depth = +depthInput.value
	// console.log(depth)
}
// window.chess = chess
// window.countDoubledPawns = countDoubledPawns
// window.countIsolatedPawns = countIsolatedPawns

function makeEngineMove(chessboard) {
	const possibleMoves = chess.moves()
	if (possibleMoves.length > 0) {
		let engineMove
		if (possibleMoves.length == 1) engineMove = possibleMoves[0];
		else {
			console.time('calculate')
			engineMove = calculate(chess, depth);
			console.timeEnd('calculate')
		}
		if (engineMove === null) {
			console.log("null move, engine can't stop mate")
			engineMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
		}
		setTimeout(() => { // smoother with 500ms delay
			if (chess.game_over()) {
				console.log('game over')
				return
			}
			chess.move(engineMove)
			pgnSpan.innerText = chess.pgn();
			chessboard.setPosition(chess.fen(), true)
			chessboard.enableMoveInput(inputHandler, COLOR.white)
		}, 500)
	}
}
function inputHandler(event) {
	event.chessboard.removeMarkers(MARKER_TYPE.dot)
	event.chessboard.removeMarkers(MARKER_TYPE.bevel)
	if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
		const moves = chess.moves({ square: event.square, verbose: true })
		for (const move of moves) { // draw dots on possible squares
			if (move.promotion && move.promotion !== "q") {
				continue
			}
			if (event.chessboard.getPiece(move.to)) {
				event.chessboard.addMarker(MARKER_TYPE.bevel, move.to)
			} else {
				event.chessboard.addMarker(MARKER_TYPE.dot, move.to)
			}
		}
		return moves.length > 0
	} else if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
		const move = { from: event.squareFrom, to: event.squareTo, promotion: event.promotion }
		const result = chess.move(move)
		if (result) {
			event.chessboard.disableMoveInput()
			this.chessboard.state.moveInputProcess.then(() => { // wait for the move input process has finished
				this.chessboard.setPosition(chess.fen(), true).then(() => { // update position, maybe castled and wait for animation has finished
					// turn = !turn
					makeEngineMove(event.chessboard)
				})
			})
		} else {
			// promotion?
			let possibleMoves = chess.moves({ square: event.squareFrom, verbose: true })
			for (const possibleMove of possibleMoves) {
				if (possibleMove.promotion && possibleMove.to === event.squareTo) {
					event.chessboard.showPromotionDialog(event.squareTo, COLOR.white, (result) => {
						console.log("promotion result", result)
						if (result) {
							chess.move({ from: event.squareFrom, to: event.squareTo, promotion: result.piece.charAt(1) })
							event.chessboard.setPosition(chess.fen(), true)
							makeEngineMove(event.chessboard)

						} else {
							event.chessboard.setPosition(chess.fen(), true)
							makeEngineMove(event.chessboard)
						}
					})
					return true
				}
			}
		}
		return result
	}
}
let board = new Chessboard(document.getElementById("containerId"),
	{
		position: FEN.start,
		style: { borderType: BORDER_TYPE.none, pieces: { file: "staunty.svg" } },
		extensions: [
			{ class: Markers, props: { autoMarkers: MARKER_TYPE.square } },
			{ class: PromotionDialog },
			{ class: Accessibility, props: { visuallyHidden: true } }
		]
	})
window.board = board;
// chess.load_pgn('1. e4 Nf6 2. Bc4 Nxe4 3. Bxf7+ Kxf7 4. Qh5+ Ke6 5. Qe2 Kf5 6. g4+ Ke5 7. Nf3+ Kf4 8. Rg1 Ng3 9. Qe5+')
// board.setPosition(chess.fen(), true)
// makeEngineMove(board)
board.enableMoveInput(inputHandler, COLOR.white)


