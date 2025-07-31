const express = require("express");
const agendaRoutes = require("./src/api/agendaRoutes");

const app = express();
const PORT = 3001;

app.use(express.json());

// Test agenda routes
app.use("/api/agenda", agendaRoutes);

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Test server werkt!" });
});

app.listen(PORT, () => {
  console.log(`🧪 Test server draait op poort ${PORT}`);
  console.log(`📡 Test: http://localhost:${PORT}/test`);
  console.log(`🏥 Agenda health: http://localhost:${PORT}/api/agenda/health`);
});
