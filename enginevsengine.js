import { Chess } from "https://cdn.jsdelivr.net/npm/chess.mjs@1/src/chess.mjs/Chess.js"
import { Chessboard, BORDER_TYPE } from "./cm-chessboard/Chessboard.js"
import { MARKER_TYPE, Markers } from "./cm-chessboard/extensions/markers/Markers.js"
import { PromotionDialog } from "./cm-chessboard/extensions/promotion-dialog/PromotionDialog.js"
import { Accessibility } from "./cm-chessboard/extensions/accessibility/Accessibility.js"
import { FEN } from "./cm-chessboard/model/Position.js"


import { calculate } from "./engine.js"

const chess = new Chess()
window.chess = chess

// let turn = true;
function makeEngineMove(chessboard) {
	const possibleMoves = chess.moves()
	if (possibleMoves.length > 0) {
		let engineMove
		if (possibleMoves.length == 1) engineMove = possibleMoves[0];
		else engineMove = calculate(chess, 2);
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

// board.enableMoveInput(inputHandler, COLOR.white)
// chess.load_pgn('1. e3 e6 2. Qg4 Qf6 3. Bb5 Qg6 4. Qxg6 hxg6 5. Nc3 Bb4 6. a3 Bxc3 7. dxc3 Rh5 8. a4 c6 9. Bc4 b5 10. axb5 cxb5 11. Bd3 Nc6 12. Nf3 Bb7 13. b4 Ke7 14. h3 Nf6 15. Bb2')
// chess.load('r7/pb1pkpp1/2n1pnp1/1p5r/1P6/2PBPN1P/1BP2PP1/R3K2R b KQ - 2 15')
// board.setPosition(chess.fen(), true);
makeEngineMove(board)


