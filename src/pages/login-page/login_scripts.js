const username_textfield = document.getElementById("username-textfield");

let currentSkin = 0;
const skins = [
    "./src/assets/skins/Smiley_Skin.webp",
    "./src/assets/skins/Alien_Skin.webp",
    "./src/assets/skins/CEO_Skin.webp",
    "src/assets/skins/Yigal_Skin.webp",
    "./src/assets/skins/STC_Skin.webp",
    "./src/assets/skins/Nerdy_Skin.webp",
    "./src/assets/skins/Cowboy_Skin.webp",
    "./src/assets/skins/Snowman_Skin.webp",
    "src/assets/skins/Pumpkin_Skin.webp"
];

function validateForm() {
    if (username_textfield.value.trim().length > 0 && username_textfield.value.length <= 10) {
        handleFormSubmit();
    }
}

function handleFormSubmit() {
    saveLoginDataInSessionStorage();
    window.location.hash = "#main_menu"; 
}

function saveLoginDataInSessionStorage() {
    const username = username_textfield.value.trim();
    window.sessionStorage.setItem("username", username);

    const selectedSkin = skins[currentSkin] || skins[0];
    window.sessionStorage.setItem("skin", selectedSkin);
}

function changeSkin(direction) {
    currentSkin += direction;
    if (currentSkin < 0) currentSkin = skins.length - 1;
    if (currentSkin >= skins.length) currentSkin = 0;

    const skinImage = document.getElementById("skin-image");
    skinImage.src = skins[currentSkin];
    button_press_sound.play();
}

function onPageLoad() {
    const skinImage = document.getElementById("skin-image");
    const savedSkin = window.sessionStorage.getItem("skin");

    if (savedSkin && skins.includes(savedSkin)) {
        currentSkin = skins.indexOf(savedSkin);
        skinImage.src = savedSkin;
    } else {
        currentSkin = 0;
        skinImage.src = skins[0];
        window.sessionStorage.setItem("skin", skins[0]);
    }
}

window.onload = onPageLoad;