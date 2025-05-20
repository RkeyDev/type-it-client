const username_textfield = document.getElementById("username-textfield");

// This is temporary, will have to change the skins to be dynamic and not hardcoded when backend is ready
let currentSkin = 0; 
let skins = ["/src/assets/skins/default-skin.png", "/src/assets/skins/glasses-suit-skin.png", "/src/assets/skins/alien-skin.png"];

function validateForm() {

    if(!(username_textfield.value.length == 0) && !(username_textfield.value.length > 15)){
        handleFormSubmit(); // Call the function to handle form submission
    }
}


function handleFormSubmit() {
    saveLoginDataInSessionStorage(); // Save the username and skin in session storage
    // Proceed to the main menu
    window.location.href = "#main_menu";
}

function saveLoginDataInSessionStorage() {
    const username = document.getElementById('username-textfield').value;
    window.sessionStorage.setItem('username', username); // Save the username in session storage
    window.sessionStorage.setItem('skin', skins[currentSkin]); // Save the current skin in session storage
}


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

window.onload = onPageLoad(); // Call the function when the page loads