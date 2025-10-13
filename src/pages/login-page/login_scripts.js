const username_textfield = document.getElementById("username-textfield");

// Temporary hardcoded skins list
let currentSkin = 0;
let skins = [
    "./src/assets/skins/Smiley_Skin.webp",
    "./src/assets/skins/Alien_Skin.webp",
    "./src/assets/skins/CEO_Skin.webp",
    "./src/assets/skins/STC_Skin.webp"
];

function validateForm() {
    if (username_textfield.value.trim().length > 0 && username_textfield.value.length <= 10 && username_textfield.value) {
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
