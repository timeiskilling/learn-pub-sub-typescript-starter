import { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handlePause } from "../internal/gamelogic/pause.js";

export function handlerPause(gs: GameState) {
  return (ps: PlayingState) => {
    handlePause(gs, ps);
    process.stdout.write("> ");
  };
}
