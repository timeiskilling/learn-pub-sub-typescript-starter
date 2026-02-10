import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import {
  ExchangePerilDirect,
  ExchangePerilTopic,
  GameLogSlug,
  PauseKey,
} from "../internal/routing/routing.js";
import { PlayingState } from "../internal/gamelogic/gamestate.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind } from "../internal/pubsub/bind.js";

async function main() {
  const connection = await amqp.connect("amqp://guest:guest@localhost:5672/");
  console.log("Connected to RabbitMQ");
  console.log("Starting Peril server...");

  const channel = await connection.createConfirmChannel();
  printServerHelp();

  await declareAndBind(
    connection,
    ExchangePerilTopic,
    GameLogSlug,
    "game_logs.*",
    "durable",
  );

  let state: PlayingState = {
    isPaused: false,
  };

  await publishJSON(channel, ExchangePerilDirect, PauseKey, state);

  process.on("SIGINT", async () => {
    console.log("Shutting down Peril server...");
    await connection.close();
    console.log("Connection closed");
    process.exit(0);
  });

  while (true) {
    const input = await getInput();
    if (input.length === 0) {
      continue;
    }

    const command = input[0];

    if (command === "pause") {
      console.log("Sending pause message");
      state.isPaused = true;
      await publishJSON(channel, ExchangePerilDirect, PauseKey, state);
    } else if (command === "resume") {
      console.log("Sending resume message");
      state.isPaused = false;
      await publishJSON(channel, ExchangePerilDirect, PauseKey, state);
    } else if (command === "quit") {
      console.log("Exiting...");
      break;
    } else {
      console.log("I don't understand that command");
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
