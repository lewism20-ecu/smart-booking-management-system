const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

app.use("/users", require("./src/routes/users"));
app.use("/bookings", require("./src/routes/bookings"));

app.listen(8080, () => console.log("API running on 8080"));

