const amqp = require("amqplib");
const { giveHouseBuildToPlayer, sendMessageToPlayer } = require("./rconService");

function getRabbitMqConfig() {
  return {
    url: process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672",
    buildPurchaseQueue:
      process.env.RABBITMQ_BUILD_PURCHASE_QUEUE || "voxelmarket.build.purchase"
  };
}

async function handleBuildPurchase(payload) {
  const minecraftUsername = String(payload?.minecraftUsername || "").trim();
  const buildName = String(payload?.buildName || "").trim();
  const quantity = Number(payload?.quantity || 1);

  if (!minecraftUsername) {
    throw new Error("minecraftUsername manquant dans le message RabbitMQ");
  }

  if (buildName.toLowerCase() === "houselosakan") {
    await giveHouseBuildToPlayer(minecraftUsername, quantity);
  }

  await sendMessageToPlayer(
    minecraftUsername,
    `VoxelMarket: achat confirme pour le build ${buildName || "inconnu"} x${quantity}.`
  );
}

async function startBuildPurchaseConsumer() {
  const config = getRabbitMqConfig();
  const connection = await amqp.connect(config.url);
  const channel = await connection.createChannel();

  await channel.assertQueue(config.buildPurchaseQueue, { durable: true });
  await channel.prefetch(1);

  await channel.consume(config.buildPurchaseQueue, async (message) => {
    if (!message) {
      return;
    }

    try {
      const payload = JSON.parse(message.content.toString("utf8"));
      await handleBuildPurchase(payload);
      channel.ack(message);
    } catch (error) {
      console.error("Echec du traitement RabbitMQ build purchase", error);
      channel.nack(message, false, false);
    }
  });

  console.log(`Consumer RabbitMQ actif sur ${config.buildPurchaseQueue}`);
}

module.exports = {
  startBuildPurchaseConsumer
};