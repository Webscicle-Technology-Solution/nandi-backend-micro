const amqp = require("amqplib");
const { logger } = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "media_events"; //Unique exchange name to use we can set

async function connectToRabbitMQ() {
  let attempts = 0;
  const maxAttempts = 10; // You can adjust the number of retries here
  const retryDelay = 5000; // 5 seconds delay between retries

  while (attempts < maxAttempts) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
      logger.info("Connected to RabbitMQ");
      return channel;
    } catch (error) {
      attempts++;
      logger.error(
        `Error connecting to RabbitMQ (attempt ${attempts}/${maxAttempts})`,
        error
      );
      if (attempts < maxAttempts) {
        // Wait for retryDelay seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        throw new Error("Unable to connect to RabbitMQ after several attempts");
      }
    }
  }
}

async function publishEvent(routingKey, message) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );

  logger.info(`Event published : ${routingKey}`);
}

async function consumeEvent(routingKey, callback) {
  if (!channel) {
    await connectToRabbitMQ();
  }

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });

  logger.info(`Subscribed to event: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, publishEvent, consumeEvent };
