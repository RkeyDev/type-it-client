let textfield = document.getElementById("username-textfield");
let form = document.getElementById("login-form");

form.onsubmit = function (event) {
    if (textfield.value.length > 10) { // Prevent form submission if the username is too long
        event.preventDefault();
        alert("Please enter a username with less than 10 characters."); 
    }
};