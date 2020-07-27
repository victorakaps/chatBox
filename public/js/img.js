$(function () {
    var socket = io();

    $('#uploadfile').bind('change', async function (event) {
        const imageFile = event.target.files[0];
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 600,
          useWebWorker: true
        }
        try {
          const compressedFile = await imageCompression(imageFile, options);
          await readThenSendFile(compressedFile);
        } catch (error) {
          console.log(error);
          await readThenSendFile(imageFile);
        }

    });

    function readThenSendFile(data) {
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