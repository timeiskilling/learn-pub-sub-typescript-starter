import amqp, { Channel } from "amqplib";
import { declareAndBind } from "./bind.js";

export enum AckType {
  Ack = "Ack",
  NackRequeue = "NackRequeue",
  NackDiscard = "NackDiscard",
}

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: "durable" | "transient",
  handler: (data: T) => Promise<AckType> | AckType,
): Promise<void> {
  const [channel, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType,
  );

  await channel.consume(
    queue.queue,
    async (msg: amqp.ConsumeMessage | null) => {
      if (!msg) {
        return;
      }
      const data = JSON.parse(msg.content.toString());
      const acktype = await handler(data);
      switch (acktype) {
        case AckType.Ack:
          channel.ack(msg);
          console.log("Ack message");
          break;
        case AckType.NackRequeue:
          channel.nack(msg, false, true);
          console.log("NackRequeue message");
          break;
        case AckType.NackDiscard:
          channel.nack(msg, false, false);
          console.log("NackDiscard message");
          break;
      }
      process.stdout.write("> ");
    },
  );
}
