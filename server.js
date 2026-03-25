require("dotenv").config({ path: ".env.example" });

const express = require("express");

const app = express();
app.use(express.json());

app.use("/users", require("./src/routes/users"));
app.use("/bookings", require("./src/routes/bookings"));

app.use("/dev", require("./src/routes/dev"));
app.use("/test", require("./src/routes/test"));

app.listen(8080, () => console.log("API running on 8080"));

