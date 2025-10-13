const username_textfield = document.getElementById("username-textfield");

// Temporary hardcoded skins list
let currentSkin = 0;
let skins = [
    "./src/assets/skins/deafult_yellow_skin.webp",
    "./src/assets/skins/deafult_blue_skin.webp",
    "./src/assets/skins/deafult_green_skin.webp",
    "./src/assets/skins/deafult_purple_skin.webp",
    "./src/assets/skins/deafult_red_skin.webp",
    "./src/assets/skins/glasses-suit-skin.png",
    "./src/assets/skins/alien-skin.png",
    "./src/assets/skins/checkered_skin.webp",
    "./src/assets/skins/earth_skin.webp",
    "./src/assets/skins/skin_nerd_1.webp",
    "./src/assets/skins/skin_smile.webp",
    "./src/assets/skins/watermelon2_skin.webp"
];

function validateForm() {
    if (username_textfield.value.length > 0 && username_textfield.value.length <= 15) {
        handleFormSubmit();
    }
}

function handleFormSubmit() {
    saveLoginDataInSessionStorage();
    window.location.href = "#main_menu";
}

function saveLoginDataInSessionStorage() {
    const username = username_textfield.value.trim();
    window.sessionStorage.setItem("username", username);

    // Always store a valid skin, fallback to default
    const selectedSkin = skins[currentSkin] || skins[0];
    window.sessionStorage.setItem("skin", selectedSkin);
}

function changeSkin(direction) {
    currentSkin += direction;

    if (currentSkin < 0) currentSkin = skins.length - 1;
    if (currentSkin >= skins.length) currentSkin = 0;

    const skinImage = document.getElementById("skin-image");
    skinImage.src = skins[currentSkin];
}

function onPageLoad() {
    const skinImage = document.getElementById("skin-image");
    const savedSkin = window.sessionStorage.getItem("skin");

    // If there's already a saved skin, use it; otherwise use the default
    if (savedSkin && skins.includes(savedSkin)) {
        currentSkin = skins.indexOf(savedSkin);
        skinImage.src = savedSkin;
    } else {
        currentSkin = 0; // default skin index
        skinImage.src = skins[0];
        window.sessionStorage.setItem("skin", skins[0]);
    }
}

window.onload = onPageLoad;
