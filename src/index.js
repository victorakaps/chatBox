const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
  generateDataMessage
} = require("./utils/messages.js");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users.js");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  console.log("new connection");
  
  socket.on("enter", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage("chatBox", "welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("chatBox", `${user.username} has joined the chat room.`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    io.to(user.room).emit(
      "message",
      generateMessage(user.username, filter.clean(message))
    );
    callback("Delivered");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("chatBox", `${user.username} has left.`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    callback();
  });
  
  socket.on("base64 file", function (msg) {
    const user = getUser(socket.id);
    io.sockets.emit("base64 file", {
      username: socket.username == "" ? "Anonymouse" : socket.username,
      file: msg.file,
      fileName: msg.fileName,
    });
  });
  
});

server.listen(port);
