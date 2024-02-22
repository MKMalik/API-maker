require("dotenv").config();
const express = require("express");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
  // Create a worker for each CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, _code, _signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  const app = express();
  const { getController } = require("./controllers/sql/get");
  const { postController } = require("./controllers/sql/post");
  const {
    createTableController,
    updateTableController,
  } = require("./controllers/table");
  const { verifyTokenWithRules } = require("./middlewares/verifyTokenWithRules");
  const { getEndpoint } = require("./middlewares/getEndpoint");
  const cors = require("cors");
  const { patchController } = require("./controllers/sql/patch");
  const { deleteController } = require("./controllers/sql/delete");

  app.use(express.json());
  app.use(cors());
  app.get("/", (_, res) => {
    res.status(200).json({ message: "OK" });
  });

  app.post("/create-table", createTableController);
  app.post("/update-table", updateTableController);

  app.get("/:endpoint", getEndpoint, verifyTokenWithRules, getController);
  app.post("/:endpoint", getEndpoint, verifyTokenWithRules, postController);
  app.patch("/:endpoint", getEndpoint, verifyTokenWithRules, patchController);
  app.delete("/:endpoint", getEndpoint, verifyTokenWithRules, deleteController);

  app.listen(5500, () => {
    console.log(`Worker ${process.pid} listening on port 5500`);
  });
}

