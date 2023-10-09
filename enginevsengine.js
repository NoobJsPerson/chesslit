import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js"
import { Chessboard, BORDER_TYPE } from "./cm-chessboard/Chessboard.js"
import { MARKER_TYPE, Markers } from "./cm-chessboard/extensions/markers/Markers.js"
import { PromotionDialog } from "./cm-chessboard/extensions/promotion-dialog/PromotionDialog.js"
import { Accessibility } from "./cm-chessboard/extensions/accessibility/Accessibility.js"
import { FEN } from "./cm-chessboard/model/Position.js"


import { calculate } from "./engine.js"

const chess = new Chess();
const depthInput = document.getElementById('depth-input');
let depth = 1;
depthInput.value = depth
depthInput.onchange = () => {
	depth = +depthInput.value
	console.log(depth)
}
window.chess = chess

// let turn = true;
function makeEngineMove(chessboard) {
	const possibleMoves = chess.moves()
	if (possibleMoves.length > 0) {
		let engineMove
		if (possibleMoves.length == 1) engineMove = possibleMoves[0];
		else engineMove = calculate(chess, depth);
		console.log(engineMove)
		setTimeout(() => { // smoother with 500ms delay
			if(chess.game_over()) {
				console.log('game over')
				return
			}
			chess.move(engineMove)
			chessboard.setPosition(chess.fen(), true)
			// chessboard.enableMoveInput(inputHandler, COLOR.white)
			makeEngineMove(chessboard)
		}, 600)
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

board.setPosition(chess.fen(), true);
makeEngineMove(board)


