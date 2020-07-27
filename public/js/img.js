$(function () {
    var socket = io();
    var username = $('#user');
    var senduser = $('#senduser');

    $('form').submit(function (e) {
      e.preventDefault(); // prevents page reloading
      socket.emit('chat message', $('#m').val());
      $('#m').val('');
      return false;
    });

    socket.on('chat message', function (msg) {
      $('#messages').append($('<li>').html(msg));
    });

    senduser.click(function () {
      console.log(username.val());
      socket.emit("change_username", { username: username.val() })
      $('#overlay').hide();
    })

    $('#m').bind("keypress", () => {
      $("html, body").animate({ scrollTop: $('#messages').height() }, 100);
      socket.emit('typing');
    })

    $('#m').keyup(function () {
      socket.emit('stop typing');
    });


    socket.on('typing', (data) => {
      $('#feedback').fadeIn();
      $('#feedback').html("<p><i>" + data.username + " is typing a message...." + "</i></p>");
    })

    socket.on('stop typing', (data) => {
      setTimeout($('#feedback').fadeOut(), 1000);
    })


    //serving images and video files
    // $('#uploadfile').bind('change', function (e) {
    //   var data = e.originalEvent.target.files[0];
    //   readThenSendFile(data);
    // });

    $('#uploadfile').bind('change', async function (event) {
      
        const imageFile = event.target.files[0];
        console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
        console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 600,
          useWebWorker: true
        }
        try {
          const compressedFile = await imageCompression(imageFile, options);
          console.log('compressedFile instanceof Blob', compressedFile instanceof Blob); // true
          console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`); // smaller than maxSizeMB

          await readThenSendFile(compressedFile); //readin the compressed file
        } catch (error) {
          console.log(error);
          await readThenSendFile(imageFile); // if filetype is not image then sent orignal data without compression
        }

    });

    function readThenSendFile(data) {

      //show progress msg
      $('#progress').fadeIn(100);

      var reader = new FileReader();
      reader.onload = function (evt) {
        var msg = {};
        msg.username = username;
        msg.file = evt.target.result;
        msg.fileName = data.name;
        socket.emit('base64 file', msg);
      };
      reader.readAsDataURL(data);

      reader.onprogress = function (currentFile) {
        if (currentFile.lengthComputable) {
          var progress = parseInt(((currentFile.loaded / currentFile.total) * 100), 10);
          $('#percentage').html(progress);
          console.log(progress);
        }
      }
      reader.onerror = function () {
        alert("Could not read the file: large file size");
      };
    }

    socket.on('base64 file', (data) => {
      //hide progress msg when data received
      $('#progress').hide();
      //appending data according to data types
      let filetype = data.fileName.split('.').pop();
      if (filetype == 'mp4' || filetype == 'ogg' || filetype == 'mkv') {
        $('#messages').append($('<li>').html(`<p class="username">${data.username}</p><video class="imgupload" src="${data.file}" height="400" width="400" controls/>`));
      } else if (filetype == 'mp3' || filetype == 'wav' || filetype == 'aac') {
        $('#messages').append($('<li>').html(`<p class="username">${data.username}</p><audio class="imgupload" src="${data.file}" height="400" width="400" controls/>`));
      } else {
        $('#messages').append($('<li>').html(`<p class="username">${data.username}</p><img class="imgupload" src="${data.file}" height="200" width="200" onclick="showimg(this)"/>`));
      }
    })

  });

  //compressing image
  // async function handleImageUpload(event) {

  //   const imageFile = event.target.files[0];
  //   console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
  //   console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

  //   const options = {
  //     maxSizeMB: 1,
  //     maxWidthOrHeight: 600,
  //     useWebWorker: true
  //   }
  //   try {
  //     const compressedFile = await imageCompression(imageFile, options);
  //     console.log('compressedFile instanceof Blob', compressedFile instanceof Blob); // true
  //     console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`); // smaller than maxSizeMB

  //     await uploadToServer(compressedFile); // write your own logic
  //   } catch (error) {
  //     console.log(error);
  //   }

  // }

  // Get the modal
  var modal = document.getElementById("myModal");

  // Get the image and insert it inside the modal - use its "alt" text as a caption
  function showimg(data) {
    var img = data;
    var modalImg = document.getElementById("img01");
    img.onclick = function () {
      modal.style.display = "block";
      modalImg.src = this.src;
    }

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
      modal.style.display = "none";
    }
  }