// Creación y configuración del SERVER
const http = require("http");
const app = require("./src/app");

const Message = require("./src/models/message.model");
// Config .env
require("dotenv").config();

// Config DB
require("./src/config/db");

// Creación server
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT);

// Listeners
server.on("listening", () => {
  console.log(`Servidor escuchando sobre el puerto ${PORT}`);
});

server.on("error", (error) => {
  console.log(error);
});

// Config WS server
const io = require("socket.io")(server, {
  cors: { origin: "*" },
});

//Event connection
// Este evento se lanza cuando un nuevo cliente se conecta a nuestro WS server
io.on("connection", async (socket) => {
  console.log("Se ha conectado un nuevo cliente");
  socket.broadcast.emit("chat_message_server", {
    nombre: "INFO",
    mensaje: "Se ha conectado un nuevo usuario",
    createdAt: new Date(),
  });

  io.emit("clients_online", io.engine.clientsCount);

  const ultimosMensajes = await Message.find().sort({ createdAt: -1 }).limit(5);

  socket.emit("chat_init", ultimosMensajes);

  socket.on("chat_message_client", async (data) => {
    data.socketId = socket.id;

    const newMessage = await Message.create(data);
    io.emit("chat_message_server", newMessage);
  });

  socket.on("disconnect", () => {
    io.emit("chat_message_server", {
      nombre: "INFO",
      mensaje: "Se ha desconectado un usuario",
      createdAt: new Date(),
    });
    io.emit("clients_online", io.engine.clientsCount);
  });
});
