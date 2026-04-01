require("dotenv").config({ path: process.env.ENV_FILE || ".env.local" });
const express = require("express");
const app = express();

app.use(express.json());

app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/users", require("./routes/users"));
app.use("/api/v1/resources", require("./routes/resources"));
app.use("/api/v1/bookings", require("./routes/bookings"));

// Error handler must be last
app.use(require("./middleware/errorHandler"));

const PORT = process.env.PORT || 8080;
if (require.main === module) {
  app.listen(PORT, () => console.log(`SBMS running on port ${PORT}`));
}

module.exports = app;
