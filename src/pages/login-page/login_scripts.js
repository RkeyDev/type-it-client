let textfield = document.getElementById("username-textfield");
let form = document.getElementById("login-form");

// This is temporary, will have to change the skins to be dynamic and not hardcoded when backend is ready
let currentSkin = 0; 
let skins = ["/src/assets/skins/default-skin.png", "/src/assets/skins/glasses-suit-skin.png", "/src/assets/skins/alien-skin.png"];


form.onsubmit = function (event) {
    if (textfield.value.length > 15) { // Prevent form submission if the username is too long
        event.preventDefault();
        alert("Please enter a username with less than 15 characters. (It will also be nice not to mess up with the code :) )"); 
    }
    else if (textfield.value.length == 0) { // Prevent form submission if the username is empty
        event.preventDefault();
    }

};
function changeSkin(direction) {
    currentSkin += direction;

    if (currentSkin < 0) currentSkin = skins.length - 1;
    if (currentSkin > skins.length -1) currentSkin = 0;

    const skinImage = document.getElementById("skin-image");
    skinImage.src = skins[currentSkin];
}

function onPageLoad() {
    const skinImage = document.getElementById("skin-image");
    skinImage.src = skins[currentSkin];
}

window.onload = onPageLoad; // Call the function when the page loads