const amqp = require("amqplib");

let connectionPromise;
let channelPromise;

function getRabbitMqConfig() {
  return {
    url: process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672",
    buildPurchaseQueue:
      process.env.RABBITMQ_BUILD_PURCHASE_QUEUE || "voxelmarket.build.purchase"
  };
}

async function getConnection() {
  if (!connectionPromise) {
    connectionPromise = amqp.connect(getRabbitMqConfig().url).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

async function getChannel() {
  if (!channelPromise) {
    channelPromise = getConnection()
      .then((connection) => connection.createChannel())
      .then(async (channel) => {
        const config = getRabbitMqConfig();
        await channel.assertQueue(config.buildPurchaseQueue, { durable: true });
        return channel;
      })
      .catch((error) => {
        channelPromise = null;
        throw error;
      });
  }

  return channelPromise;
}

async function publishBuildPurchase(payload) {
  const channel = await getChannel();
  const { buildPurchaseQueue } = getRabbitMqConfig();

  channel.sendToQueue(buildPurchaseQueue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json"
  });
}

module.exports = {
  getRabbitMqConfig,
  publishBuildPurchase
};