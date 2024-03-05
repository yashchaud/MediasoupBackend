const mediasoup = require("mediasoup");
const os = require("os");

// async function createWorker() {
//   const numCores = os.cpus().length;

//   const worker = await mediasoup.createWorker({
//     logLevel: "debug",
//     logTags: ["rtp", "srtp", "rtcp"],
//     rtcMinPort: 2000,
//     rtcMaxPort: 2100,
//   });

//   console.log(`worker pid ${worker.pid}`);

//   worker.on("died", (error) => {
//     console.error("mediasoup worker has died");
//     setTimeout(() => process.exit(1), 2000);
//   });

//   return worker;
// }

async function createWebRtcTransport(router) {
  return new Promise(async (resolve, reject) => {
    try {
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: "127.0.0.1",
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      let transport = await router.createWebRtcTransport(
        webRtcTransport_options
      );
      console.log(`transport id: ${transport.id}`);

      transport.on("dtlsstatechange", (dtlsState) => {
        if (dtlsState === "closed") {
          transport.close();
        }
      });

      transport.on("close", () => {
        console.log("transport closed");
      });

      resolve(transport);
    } catch (error) {
      reject(error);
    }
  });
}

async function pipeProducersBetweenRouters({
  producerIds,
  sourceRouter,
  targetRouter,
  alreadyPipedProducersforcheck,
  alreadyPipedProducer,
}) {
  for (const producerId of producerIds) {
    if (alreadyPipedProducersforcheck.has(producerId)) {
      console.log(`Producer ${producerId} already piped. Skipping.`);
      continue;
    }
    try {
      const { pipeConsumer, pipeProducer } = await sourceRouter.pipeToRouter({
        producerId,
        router: targetRouter,
      });

      console.log(`Successfully piped producer ${producerId} to target router`);
      // Track piped producer to avoid duplicate attempts
      alreadyPipedProducersforcheck.add(producerId);
      alreadyPipedProducer.add(pipeProducer);
      

      // Handle producer close events
      pipeConsumer.on("producerclose", () => {
        console.log(`Consumer for producer ${producerId} closed`);
      });
      pipeProducer.on("producerclose", () => {
        console.log(`Producer ${producerId} closed`);
      });
    } catch (error) {
      console.error(`Error piping producer ${producerId}: ${error.message}`);
    }
  }
}

module.exports = {
  createWebRtcTransport,
  pipeProducersBetweenRouters,
};
