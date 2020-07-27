const socket = io();

const $messageForm = document.querySelector("#input");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#location");
const $messages = document.querySelector("#messages");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix: true})

const autoscroll = () => {
  const $newMessage = $messages.lastElementChild

  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
  
  const visibleHeight = $messages.offsetHeight

  const contentHeight = $messages.scrollHeight

  const scrollOffset = $messages.scrollTop + visibleHeight

  if(contentHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight
  }
}


socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm A')
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

socket.on("locationMessage",(message)=>{
  console.log(message)
  const html = Mustache.render(locationTemplate,{
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm A')
  });
  $messages.insertAdjacentHTML("beforeend",html);
  autoscroll()
})

socket.on('roomData',({room, users})=>{
  const html = Mustache.render(sidebarTemplate,{
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.msg.value;
  socket.emit("sendMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log("the message was delivered", msg);
  });
});

$locationButton.addEventListener("click", () => {
  $locationButton.setAttribute("disabled", "disabled");

  if (!navigator.geolocation) return alert("Error in fetching location");
  else {
    navigator.geolocation.getCurrentPosition((position) => {
      socket.emit(
        "sendLocation",
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        () => {
          console.log("location shared");
          $locationButton.removeAttribute("disabled");
        }
      );
    });
  }
});

socket.emit('enter',{username, room},(error)=>{
  if(error){
    alert(error)
    location.href = "/"
  }
})