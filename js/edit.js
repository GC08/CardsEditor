document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.getElementById('card-container');
    const addCardBtn = document.getElementById('add-card-btn');
    let cardTemplateString = '';
    let cardsData = {}; // Will hold the parsed JSON { cards: { ... } }

    // --- Initialization ---
    async function init() {
        try {
            const [templateResponse, dataResponse] = await Promise.all([
                fetch('templates/card.html'),
                fetch('cards.json')
            ]);

            if (!templateResponse.ok) throw new Error(`Failed to fetch template: ${templateResponse.statusText}`);
            if (!dataResponse.ok) throw new Error(`Failed to fetch card data: ${dataResponse.statusText}`);

            cardTemplateString = await templateResponse.text();
            cardsData = await dataResponse.json();

            if (!cardsData || !cardsData.cards) {
                console.error("Card data is missing or not in the expected format:", cardsData);
                cardsData = { cards: {} }; // Initialize safely
            }


            renderAllCards();
            addEventListeners();

        } catch (error) {
            console.error("Initialization failed:", error);
            cardContainer.innerHTML = '<p style="color: red;">Error loading card data or template.</p>';
        }
    }

    // --- Rendering ---
    function renderAllCards() {
        cardContainer.innerHTML = ''; // Clear existing cards
        if (cardsData && cardsData.cards) {
            for (const cardName in cardsData.cards) {
                renderCard(cardName, cardsData.cards[cardName]);
            }
        } else {
             console.warn("No cards found in data to render.");
        }
    }

    function renderCard(name, details) {
        let cardHtml = cardTemplateString;

        // Basic replacements
        cardHtml = cardHtml.replace(/{{NAME}}/g, name); // Replace all instances of name
        cardHtml = cardHtml.replace('{{YEAR}}', details.year || 'N/A');
        cardHtml = cardHtml.replace('{{IMAGE_SRC}}', `card_images/${name}.png`); // Assumes PNG format

        // Stats - Stars
        cardHtml = cardHtml.replace('{{SPEED_STARS}}', generateStarsHTML('speed', details.speed || 0));
        cardHtml = cardHtml.replace('{{ACCELERATION_STARS}}', generateStarsHTML('acceleration', details.acceleration || 0));
        cardHtml = cardHtml.replace('{{HANDLING_STARS}}', generateStarsHTML('handling', details.handling || 0));

        // Costs
        cardHtml = cardHtml.replace('{{MONEY_COST}}', details.money || 0);
        cardHtml = cardHtml.replace('{{GAS_COST}}', details.gas || 0);
        cardHtml = cardHtml.replace('{{TIRES_COST}}', details.tires || 0);
        cardHtml = cardHtml.replace('{{PARTS_COST}}', details.parts || 0);
        cardHtml = cardHtml.replace('{{TOOLS_COST}}', details.tools || 0);

        // Create element and append
        const cardElement = document.createElement('div');
        cardElement.innerHTML = cardHtml; // Use innerHTML on a temporary div
        const actualCard = cardElement.firstElementChild; // Get the actual .card-template div
        if(actualCard) {
             // Set data attribute for easier identification in event handlers
            actualCard.dataset.cardName = name;
            cardContainer.appendChild(actualCard);
        } else {
            console.error("Could not create card element from template for:", name);
        }

    }

    function generateStarsHTML(statName, rating) {
        let starsHtml = '';
        const filledStars = Math.max(0, Math.min(5, rating)); // Clamp rating between 0 and 5
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<div class="star ${i <= filledStars ? 'filled' : ''}" data-value="${i}"></div>`;
        }
        return starsHtml;
    }

    // --- Event Listeners ---
    function addEventListeners() {
        addCardBtn.addEventListener('click', handleAddCardClick);
        cardContainer.addEventListener('click', handleCardContainerClick);
    }

    // --- Event Handlers ---
    function handleAddCardClick() {
        const newCardName = prompt("Enter the name for the new card:");
        if (!newCardName || newCardName.trim() === "") {
            alert("Card name cannot be empty.");
            return;
        }
        if (cardsData.cards[newCardName]) {
            alert(`Card with name "${newCardName}" already exists.`);
            return;
        }

        // Add default card data
        cardsData.cards[newCardName] = {
            year: "YYYY", // Default year
            speed: 3,
            acceleration: 3,
            handling: 3,
            money: 1,
            gas: 1,
            tires: 1,
            parts: 1,
            tools: 1
        };

        // Render the new card
        renderCard(newCardName, cardsData.cards[newCardName]);
        // Note: Changes are only in memory, not saved to file.
    }

    function handleCardContainerClick(event) {
        const target = event.target;
        const cardElement = target.closest('.card-template');
        if (!cardElement) return; // Click wasn't inside a card

        const cardName = cardElement.dataset.cardName;
        if (!cardName || !cardsData.cards[cardName]) return; // Card data not found

        // Handle Star Clicks
        if (target.classList.contains('star') && target.parentElement.classList.contains('stars')) {
            const statGroup = target.parentElement;
            const statName = statGroup.dataset.stat;
            const newValue = parseInt(target.dataset.value, 10);

            if (statName && !isNaN(newValue)) {
                cardsData.cards[cardName][statName] = newValue;
                // Re-render stars for this stat
                statGroup.innerHTML = generateStarsHTML(statName, newValue);
                 // Note: Changes are only in memory
            }
        }

        // Handle Cost Clicks (Simple Increment)
        const costItem = target.closest('.cost-item');
         if (costItem && (target.classList.contains('cost-icon') || target.classList.contains('cost-value'))) {
            const costName = costItem.dataset.cost;
            if (costName) {
                let currentValue = parseInt(cardsData.cards[cardName][costName] || 0, 10);
                currentValue++; // Simple increment
                cardsData.cards[cardName][costName] = currentValue;
                // Update displayed value
                const valueSpan = costItem.querySelector('.cost-value');
                if (valueSpan) {
                    valueSpan.textContent = currentValue;
                }
                 // Note: Changes are only in memory
            }
        }

        // TODO: Add handlers for editing name/year if needed
        // Example: Make name editable
        // if (target.classList.contains('card-name')) {
        //     makeEditable(target, cardName, 'name');
        // }
        // if (target.classList.contains('card-year')) {
        //     makeEditable(target, cardName, 'year');
        // }
    }

    // --- Helper for making text editable (Example - needs refinement) ---
    /*
    function makeEditable(element, cardName, propertyName) {
        const currentValue = element.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;
        input.className = 'editable-input'; // Add class for styling

        element.replaceWith(input);
        input.focus();

        input.addEventListener('blur', () => {
            const newValue = input.value.trim();
            // !! IMPORTANT: Changing the 'name' property here is complex
            // because it's the key in our cardsData.cards object.
            // For now, just update the display or handle year only.
            if (propertyName === 'year') {
                 cardsData.cards[cardName][propertyName] = newValue;
                 const newElement = document.createElement(element.tagName.toLowerCase());
                 newElement.className = element.className;
                 newElement.textContent = newValue;
                 input.replaceWith(newElement);
            } else {
                 // Revert if not saving (or handle name change complexity)
                 const originalElement = document.createElement(element.tagName.toLowerCase());
                 originalElement.className = element.className;
                 originalElement.textContent = currentValue; // Revert
                 input.replaceWith(originalElement);
                 alert("Name editing not fully implemented yet due to key constraints.");
            }

        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger the blur event to save/revert
            } else if (e.key === 'Escape') {
                 // Revert without saving
                 const originalElement = document.createElement(element.tagName.toLowerCase());
                 originalElement.className = element.className;
                 originalElement.textContent = currentValue;
                 input.replaceWith(originalElement);
            }
        });
    }
    */


    // --- Start the application ---
    init();
});