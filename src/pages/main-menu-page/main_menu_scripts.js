let textfield = document.getElementById("room-code-textfield");
let form = document.getElementById("room-code-form");


form.onsubmit = function (event) {
    if (textfield.value.length > 15) { // Prevent form submission if the room code is too long
        event.preventDefault();
        alert("Please enter a room code with less than 15 characters. (It will also be nice not to mess up with the code :) )"); 
    }
    else if (textfield.value.length == 0) { // Prevent form submission if the room code is empty
        event.preventDefault();
    }
}