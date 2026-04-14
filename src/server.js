import "dotenv/config";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { environmentVariables } from "./config/config.env.js";

connectDB()
  .then(() => {
    const server = app.listen(environmentVariables.PORT || 8000, () => {
      console.log(`Server is running on port : ${environmentVariables.PORT}`);
    });
    server.on("error", (error) => {
      console.error("Server failed to start", error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.log("MONGODB Connection failed !!!!", error);
  });
