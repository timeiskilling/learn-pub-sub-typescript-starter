import amqp, { Channel } from "amqplib";
import { declareAndBind } from "./bind.js";

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: "durable" | "transient",
  handler: (data: T) => void,
): Promise<void> {
  const [channel, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType,
  );

  await channel.consume(queue.queue, (msg: amqp.ConsumeMessage | null) => {
    if (!msg) {
      return;
    }
    const data = JSON.parse(msg.content.toString());
    handler(data);
    channel.ack(msg);
  });
}
