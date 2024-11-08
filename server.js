const express = require("express");
const app = express();
const morgan = require("morgan");
const { readdirSync } = require("fs");
const cors = require("cors");

const authRouter = require("./routes/authentication.js");
const categoryRouter = require("./routes/category.js");

// middleware
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(cors());

// app.use("/api", authRouter);
// app.use("/api", categoryRouter);
readdirSync("./routes").map((item) => app.use("/api", require("./routes/" + item)));

// router

app.listen(5001, () => {
  console.log(`server is running on PORT 5001`);
});
