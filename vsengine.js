import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js"
import { INPUT_EVENT_TYPE, COLOR, Chessboard, BORDER_TYPE } from "./cm-chessboard/Chessboard.js"
import { MARKER_TYPE, Markers } from "./cm-chessboard/extensions/markers/Markers.js"
import { PromotionDialog } from "./cm-chessboard/extensions/promotion-dialog/PromotionDialog.js"
import { Accessibility } from "./cm-chessboard/extensions/accessibility/Accessibility.js"
import { FEN } from "./cm-chessboard/model/Position.js"
import eco_codes from './codes.json' assert { type: 'json' };


import { calculate, evaluate } from "./engine.js"


const ecoSpan = document.getElementById("ecoId");
const chess = new Chess()
window.chess = chess
// let turn = true;
function makeEngineMove(chessboard) {
	const possibleMoves = chess.moves()
	if (possibleMoves.length > 0) {
		const engineMove = calculate(chess, 3)
		console.log(engineMove)
		setTimeout(() => { // smoother with 500ms delay
			chess.move(engineMove.parentMove)
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
					ecoSpan.innerText = eco_codes[chess.fen().split(' ').slice(0,3).join(' ')]?.name || ecoSpan.innerText
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
							ecoSpan.innerText = eco_codes[chess.fen().split('-')[0].trim()]?.name || ecoSpan.innerText
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
const board = new Chessboard(document.getElementById("containerId"),
	{
		position: FEN.start,
		style: { borderType: BORDER_TYPE.none, pieces: { file: "staunty.svg" } },
		extensions: [
			{ class: Markers, props: { autoMarkers: MARKER_TYPE.square } },
			{ class: PromotionDialog },
			{ class: Accessibility, props: { visuallyHidden: true } }
		]
	})
board.enableMoveInput(inputHandler, COLOR.white)