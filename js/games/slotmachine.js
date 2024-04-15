(function () {
  const jsonData = `{
        "projects": [
          {
            "name": "Ekozarcek",
            "year": 2016,
            "service": "SERVICE"
          },
          {
            "name": "Vinakoper",
            "year": 2018,
            "service": "SERVICE"
          },
          {
            "name": "žalec",
            "year": 2019,
            "service": "SERVICE"
          },
          {
            "name": "Harvest",
            "year": 2017,
            "service": "SERVICE"
          },
          {
            "name": "Philips",
            "year": 2020,
            "service": "SERVICE"
          },
          {
            "name": "Polymetrija",
            "year": 2015,
            "service": "SERVICE"
          },
          {
            "name": "Vivalis",
            "year": 2022,
            "service": "SERVICE"
          },
          {
            "name": "Orbico",
            "year": 2014,
            "service": "SERVICE"
          },
          {
            "name": "Bg",
            "year": 2023,
            "service": "SERVICE"
          },
          {
            "name": "Supernova",
            "year": 2013,
            "service": "SERVICE"
          },
          {
            "name": "Floramare",
            "year": 2021,
            "service": "SERVICE"
          }
        ]
      }`;

  const data = JSON.parse(jsonData);
  const projects = data.projects.reverse(); // Reverse the projects array, the slotmachine counts from bottom to top.
  const numSymbols = projects.length;
  let indexes = [0, 0, 0]; // Array to keep track of the winline
  let reelHeight; // Height of each reel (pixels)
  let symbolHeight; // Height of each symbol (percentage)
  let timePerSymbol = 100; // Time in milliseconds for each symbol rotation
  let guaranteedWinMode = false; // Flag for guaranteedWinMode mode
  let winningSymbolIndexes = []; // Array to keep track of the winning symbols
  let winningSymbolIndex = 0; // Current winning symbol

  const reels = Array.from(document.getElementsByClassName("game-slotmachine-reel"));
  const btn = document.getElementById("game-slotmachine-btn");

  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  function shuffle(array) {
    let currentIndex = array.length;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  }

  // Create the array to keep track of the winning symbols
  function createWinningSymbolIndexes() {
    winningSymbolIndexes = [];
    for (let i = 0; i < numSymbols; i++) {
      winningSymbolIndexes.push(i);
    }
    // Shuffle the array so it's not in the same order every time.
    // Ex: [6, 4, 0, 1, 2, 5, 7, 3, 10, 8, 9]
    shuffle(winningSymbolIndexes);
    winningSymbolIndex = 0;
  }

  // Function to update reel variables.
  function updateVariables(reels) {
    reelHeight = getComputedStyle(reels[0])["height"];
    symbolHeight = `calc((100% - ${reelHeight}) / ${numSymbols})`;
  }

  // Set initial background position for reels
  // Places the symbols in the middle of the reel, instead of at the top.
  function setStartOffset(reels) {
    reels.forEach((reel) => {
      reel.style.backgroundPositionY = `calc((${reelHeight} - ${symbolHeight}) / 2)`;
    });
  }

  function calculateSymbolOffset(offset, guaranteedWinMode) {
    // Number of symbols that come by. Always two full rotations + offset. Example, if offset is 2, the reel will have 4 full rotations.
    let symbolOffset = (offset + 2) * numSymbols;
    // Based on the current backgroundposition, calculate how much the reel needs to rotate to land on the winning index.
    if (guaranteedWinMode) {
      let indexToLandOn = winningSymbolIndexes[winningSymbolIndex];
      symbolOffset += indexToLandOn - indexes[offset];
    } else {
      // Add delta with a random number between 0 and the number of icons, so they stop at different random offset
      symbolOffset += Math.round(Math.random() * numSymbols);
    }
    return symbolOffset;
  }

  function calculateTargetBackgroundPositionY(reel, symbolOffset) {
    const backgroundPositionY = getComputedStyle(reel)["background-position-y"];
    return `calc(${backgroundPositionY} - calc(${symbolOffset} * ${symbolHeight}`;
  }

  function animateReel(reel, symbolOffset, targetBackgroundPositionY) {
    reel.style.transition = `background-position-y ${
      symbolOffset * timePerSymbol
    }ms cubic-bezier(.45,.05,.58,1.06)`;
    reel.style.backgroundPositionY = targetBackgroundPositionY;
  }

  // Function that animates one reel, this way we can have a delay for the other reel.
  function roll(reel, offset = 0, guaranteedWinMode) {
    const symbolOffset = calculateSymbolOffset(offset, guaranteedWinMode);
    const targetBackgroundPositionY = calculateTargetBackgroundPositionY(reel, symbolOffset);
    animateReel(reel, symbolOffset, targetBackgroundPositionY);
    // Return a promise which resolves when the reels finishes rolling.
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(symbolOffset % numSymbols);
      }, symbolOffset * timePerSymbol);
    });
  }

  function rollAll(reels, guaranteedWinMode) {
    Promise.all(reels.map((reel, i) => roll(reel, i, guaranteedWinMode))).then((symbolOffsets) => {
      // Enable button events after all reels finish rolling
      btn.style.pointerEvents = "auto";

      // Update the winline
      symbolOffsets.forEach(
        (symbolOffset, i) => (indexes[i] = (indexes[i] + symbolOffset) % numSymbols)
      );

      // check win conditions
      if (indexes[0] === indexes[1] && indexes[0] === indexes[2]) {
        const winningProject = projects[indexes[0]];
        window.alert(JSON.stringify(winningProject));
      }
    });
  }

  function toggleGuaranteedWinMode() {
    // Update guaranteedWinMode index if guaranteedWinMode is enabled
    if (guaranteedWinMode) {
      winningSymbolIndex++;
    }

    // Toggle guaranteedWinMode mode
    guaranteedWinMode = !guaranteedWinMode;
  }

  function initializeSlotMachine() {
    // Update variables based on reel properties
    updateVariables(reels);
    // Set the symbol in the middle of the reel instead of at the top.
    setStartOffset(reels);
    // Start the reels at a random offset (without animation)
    timePerSymbol = 0;
    rollAll(reels, (guaranteedWinMode = false));
    // Reset speed
    timePerSymbol = 100;
    // Create array to keep track of winning array
    createWinningSymbolIndexes();
  }

  function handleButtonClick() {
    // Disable the button while rolling
    btn.style.pointerEvents = "none";
    // Check if all symbols were already shown, if so, reset guaranteedWinMode index
    if (guaranteedWinMode && winningSymbolIndex >= numSymbols) {
      createWinningSymbolIndexes();
    }
    // Roll the reels
    rollAll(reels, guaranteedWinMode);

    // Toggle guaranteedWinMode mode
    toggleGuaranteedWinMode();
  }

  // Event listener for window resize
  window.addEventListener("resize", () => {
    updateVariables(reels);
    // TODO: set positions based on the indexes
  });

  btn.addEventListener("click", handleButtonClick);

  initializeSlotMachine();
})();
