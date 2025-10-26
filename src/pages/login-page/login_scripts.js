const username_textfield = document.getElementById("username-textfield");
        const error_sound = new Audio("./src/assets/sounds/wrong-guess-sound.mp3");

        let currentSkin = 0;
        const skins = [
            "./src/assets/skins/Smiley_Skin.webp",
            "./src/assets/skins/Alien_Skin.webp",
            "./src/assets/skins/CEO_Skin.webp",
            "./src/assets/skins/Yigal_Skin.webp",
            "./src/assets/skins/Nerdy_Skin.webp",
            "./src/assets/skins/STC_Skin.webp",
            "./src/assets/skins/Cowboy_Skin.webp",
            "./src/assets/skins/Sombrero_Skin.webp",
            "./src/assets/skins/Snowman_Skin.webp",
            "./src/assets/skins/Pumpkin_Skin.webp",
            "./src/assets/skins/Cat_Skin.webp"
        ];

        const tutorialSteps = [
            { 
                text: "Welcome to Type It! This tutorial will guide you through the key features of the game.", 
                image: "./src/assets/tutorial-images/intro.png" 
            },
            { 
                text: "Begin by selecting a username and avatar using the navigation arrows. Confirm your selection when ready.", 
                image: "./src/assets/tutorial-images/login.png" 
            },
            { 
                text: "You can join an existing room via a room code or matchmaking, or create a new room to host your own game.", 
                image: "./src/assets/tutorial-images/main-menu.png" 
            },
            { 
                text: "As the host of a room, you can configure settings such as typing time, character goal, matchmaking options, and game language.", 
                image: "./src/assets/tutorial-images/room-creation.png" 
            },
            { 
                text: "If you join a room as a participant, you will need to wait until the host starts the game.", 
                image: "./src/assets/tutorial-images/wait-for-game.png" 
            },
            { 
                text: "During the game, type words that relate to the current topic to score points.", 
                image: "./src/assets/tutorial-images/game-start.png" 
            },
            { 
                text: "Longer words earn more points, as your score is based on word length.", 
                image: "./src/assets/tutorial-images/longest-answer.png" 
            },
            { 
                text: "The first player to reach the character goal wins the game.", 
                image: "./src/assets/tutorial-images/winning-screen.png" 
            },
            { 
                text: "Good Luck!", 
                image: "./src/assets/Logo.png" 
            }
        ];

        let currentTutorialIndex = 0;
        const tutorialContainer = document.getElementById("tutorial-container");
        const tutorialText = document.getElementById("tutorial-text");
        const tutorialImage = document.getElementById("tutorial-image");



        function updateTutorialStep() {
            
            const step = tutorialSteps[currentTutorialIndex];
            tutorialText.textContent = step.text;

            if (step.image) {
                tutorialImage.style.display = "block";

                const isMobile = window.innerWidth <= 1080;
                let imagePath = step.image;

                if (isMobile) {
                    const dotIndex = step.image.lastIndexOf(".");
                    if (step.image.slice(0, dotIndex) != "./src/assets/logo")
                        imagePath = step.image.slice(0, dotIndex) + "-mobile" + step.image.slice(dotIndex);
                    else
                        tutorialImage.style.width = "60%";
                }  
                else{
                    tutorialImage.style.width = currentTutorialIndex === tutorialSteps.length - 1 ? "30%" : "60%";
                }

                tutorialImage.src = imagePath;
                
            } else {
                tutorialImage.style.display = "none";
            }
        }

        window.addEventListener("resize", () => {
            updateTutorialStep();
        });

        document.getElementById("tutorial-next").addEventListener("click", () => {
            if (currentTutorialIndex < tutorialSteps.length - 1) {
                currentTutorialIndex++;
                updateTutorialStep();
            }
        });

        document.getElementById("tutorial-prev").addEventListener("click", () => {
            if (currentTutorialIndex > 0) {
                currentTutorialIndex--;
                updateTutorialStep();
            }
        });

        document.getElementById("tutorial-close").addEventListener("click", () => {
            tutorialContainer.classList.add("hidden");
            document.body.style.visibility = "visible";
            setCookie("tutorial-seen","true",365);
        });

        function setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
        }

        function validateForm() {
            if (username_textfield.value.trim().length > 0 && username_textfield.value.length <= 10) {
                handleFormSubmit();
            } else {
                username_textfield.classList.add("error");
                error_sound.currentTime = 0;
                error_sound.play();
                setTimeout(() => {
                    username_textfield.placeholder = "Enter Your Nickname...";
                    username_textfield.classList.remove("error");
                    username_textfield.disabled = false;
                    username_textfield.focus();
                }, 400);
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

            // Check if the tutorial has already been seen
            const tutorialSeen = getCookie("tutorial-seen");
            if (tutorialSeen === "true") {
                tutorialContainer.classList.add("hidden");
                document.body.style.visibility = "visible";
            } else {
                tutorialContainer.classList.remove("hidden");
                updateTutorialStep();
            }
        }


        function getCookie(name) {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const c = cookies[i].trim();
                if (c.startsWith(name + "=")) {
                    return decodeURIComponent(c.substring(name.length + 1));
                }
            }
            return null;
        }

        window.addEventListener("load", () => {
            onPageLoad();
            
        });