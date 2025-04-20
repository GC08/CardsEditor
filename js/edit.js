document.addEventListener('DOMContentLoaded', () => {
    const cardContainer = document.getElementById('card-container');
    const addCardBtn = document.getElementById('add-card-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn'); // Get save button
    const printSelectedBtn = document.getElementById('print-selected-btn'); // Get print button
    const selectAllCheckbox = document.getElementById('select-all-checkbox'); // Get select all checkbox
    let cardTemplateString = '';
    let cardsData = {}; // Will hold the parsed JSON { cards: { ... } }

    // --- Initialization ---
    async function init() {
        try {
            // Stop any previous server first if needed (handled by user/script)
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
            // Sort card names alphabetically for consistent order
            const sortedCardNames = Object.keys(cardsData.cards).sort();
            sortedCardNames.forEach(cardName => {
                 renderCard(cardName, cardsData.cards[cardName]);
            });
        } else {
             console.warn("No cards found in data to render.");
        }
        adjustCardHeights(); // Adjust heights after rendering
    }

    // --- Helper to generate HTML string for a single card ---
    function getCardHtml(name, details) {
        let cardHtml = cardTemplateString;

        // Basic replacements
        cardHtml = cardHtml.replace(/{{NAME}}/g, escapeHtml(name)); // Replace all instances of name, escape HTML
        cardHtml = cardHtml.replace('{{YEAR}}', escapeHtml(details.year || 'N/A'));
        // Construct image path safely - Use absolute path for print view if needed, but relative should work if print.html is at root
        const imagePath = `card_images/${encodeURIComponent(name)}.png`;
        cardHtml = cardHtml.replace('{{IMAGE_SRC}}', imagePath);

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

        return cardHtml.trim();
    }

    // --- Renders a card and appends it to the main container ---
    function renderCard(name, details) {
        const cardHtmlString = getCardHtml(name, details);
        if (!cardHtmlString) {
             console.error("Could not generate card HTML string for:", name);
             return;
        }

        // Create element and append
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtmlString;
        const actualCard = tempDiv.firstElementChild; // Get the actual .card-template div

        if(actualCard) {
             // Set data attribute for easier identification in event handlers
            actualCard.dataset.cardName = name; // Store original name for lookups
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
        saveChangesBtn.addEventListener('click', handleSaveChangesClick); // Listener for save button
        printSelectedBtn.addEventListener('click', handlePrintSelectedClick); // Listener for print button
        selectAllCheckbox.addEventListener('change', handleSelectAllChange); // Listener for select all checkbox
        cardContainer.addEventListener('click', handleCardContainerClick);
        cardContainer.addEventListener('contextmenu', handleCardContainerRightClick); // Listener for right-clicks (for decrement)
        cardContainer.addEventListener('dblclick', handleCardContainerDoubleClick); // Use double-click for editing text
    }

    // --- Event Handlers ---
    async function handleSaveChangesClick() {
        console.log("Attempting to save card data...");
        try {
            const response = await fetch('/save_cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cardsData) // Send the entire cardsData object
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                alert("Cards saved successfully!");
                console.log("Save successful:", result.message);
            } else {
                throw new Error(result.message || `Server responded with status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error saving cards:", error);
            alert(`Failed to save cards: ${error.message}`);
        }
    }

    function handleAddCardClick() {
        const newCardName = prompt("Enter the name for the new card (will also be image filename):");
        if (!newCardName || newCardName.trim() === "") {
            alert("Card name cannot be empty.");
            return;
        }
        const trimmedName = newCardName.trim();
        if (cardsData.cards[trimmedName]) {
            alert(`Card with name "${trimmedName}" already exists.`);
            return;
        }

        // Add default card data
        cardsData.cards[trimmedName] = {
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

        // Render the new card and adjust heights
        renderCard(trimmedName, cardsData.cards[trimmedName]);
        adjustCardHeights();
        // Note: Changes are only in memory, not saved to file.
    }

    function handleCardContainerClick(event) {
        const target = event.target;
        const cardElement = target.closest('.card-template');
        if (!cardElement) return;

        const cardName = cardElement.dataset.cardName;
        if (!cardName || !cardsData.cards[cardName]) return;

        // Handle Star Clicks
        if (target.classList.contains('star') && target.parentElement.classList.contains('stars')) {
            const statGroup = target.parentElement;
            const statName = statGroup.dataset.stat;
            const newValue = parseInt(target.dataset.value, 10);

            if (statName && !isNaN(newValue)) {
                cardsData.cards[cardName][statName] = newValue;
                statGroup.innerHTML = generateStarsHTML(statName, newValue);
            }
        }

        // Handle Remove Button Click
        if (target.classList.contains('remove-card-btn')) {
            if (confirm(`Are you sure you want to remove the card "${cardName}"? This action is only in memory.`)) {
                delete cardsData.cards[cardName]; // Remove from in-memory data
                cardElement.remove(); // Remove from DOM
                adjustCardHeights(); // Re-adjust heights
            }
        }

        // Handle Cost Clicks (Left-click = Increment)
        const costItem = target.closest('.cost-item');
         if (costItem && (target.classList.contains('cost-icon') || target.classList.contains('cost-value'))) {
            const costName = costItem.dataset.cost;
            if (costName) {
                let currentValue = parseInt(cardsData.cards[cardName][costName] || 0, 10);
                currentValue++; // Simple increment
                cardsData.cards[cardName][costName] = currentValue;
                const valueSpan = costItem.querySelector('.cost-value');
                if (valueSpan) valueSpan.textContent = currentValue;
            }
    
        } // End of costItem check
    
        // Handle Year Click for Editing (Moved outside costItem check)
        if (target.classList.contains('card-year')) {
            makeEditable(target, cardName, 'year');
        }

        // Handle individual checkbox clicks to update "Select All" state
        if (target.classList.contains('card-select-checkbox')) {
            updateSelectAllCheckboxState();
        }
    } // End of handleCardContainerClick

    function handleSelectAllChange() {
        const isChecked = selectAllCheckbox.checked;
        const cardCheckboxes = cardContainer.querySelectorAll('.card-select-checkbox');
        cardCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    }

    // --- Helper to update the "Select All" checkbox based on individual card checkboxes ---
    function updateSelectAllCheckboxState() {
        const cardCheckboxes = cardContainer.querySelectorAll('.card-select-checkbox');
        const totalCheckboxes = cardCheckboxes.length;
        const checkedCheckboxes = cardContainer.querySelectorAll('.card-select-checkbox:checked').length;

        if (totalCheckboxes === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false; // No cards, not indeterminate
        } else if (checkedCheckboxes === totalCheckboxes) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes > 0) {
            selectAllCheckbox.checked = false; // Uncheck if not all are checked
            selectAllCheckbox.indeterminate = true; // Show indeterminate state if some are checked
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }


     function handleCardContainerRightClick(event) {
        const target = event.target;
        const costItem = target.closest('.cost-item');

        // Handle Cost Right-Clicks (Decrement)
         if (costItem && (target.classList.contains('cost-icon') || target.classList.contains('cost-value'))) {
            event.preventDefault(); // Prevent browser context menu
            const cardElement = target.closest('.card-template');
            if (!cardElement) return;
            const cardName = cardElement.dataset.cardName;
            if (!cardName || !cardsData.cards[cardName]) return;

            const costName = costItem.dataset.cost;
            if (costName) {
                let currentValue = parseInt(cardsData.cards[cardName][costName] || 0, 10);
                currentValue = Math.max(0, currentValue - 1); // Decrement, minimum 0
                cardsData.cards[cardName][costName] = currentValue;
                const valueSpan = costItem.querySelector('.cost-value');
                if (valueSpan) valueSpan.textContent = currentValue;
            }
        }
    }

    function handleCardContainerDoubleClick(event) {
        const target = event.target;
        const cardElement = target.closest('.card-template');
        if (!cardElement) return;
        const cardName = cardElement.dataset.cardName;

        // Handle Name/Year Double Click for Editing
        if (target.classList.contains('card-name')) {
            makeEditable(target, cardName, 'name');
        }
        // Year editing moved to single click handler
    }


    // --- Helper for making text editable ---
    function makeEditable(element, cardName, propertyName) {
        // Prevent making editable if already editing
        if (element.querySelector('input.editable-input')) return;

        const originalValue = element.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalValue;
        input.className = 'editable-input'; // Add class for styling
        input.style.width = '90%'; // Adjust width as needed

        // Clear the element and append the input
        element.textContent = '';
        element.appendChild(input);
        input.focus();
        input.select(); // Select text for easy replacement

        const saveChanges = () => {
            const newValue = input.value.trim();
            // Restore original element structure
            element.textContent = newValue || originalValue; // Use new value or revert if empty

            if (newValue && newValue !== originalValue) {
                 if (propertyName === 'year') {
                    cardsData.cards[cardName][propertyName] = newValue;
                    console.log(`Updated year for ${cardName} to ${newValue}`);
                 } else if (propertyName === 'name') {
                    // ** IMPORTANT: Renaming the card is complex **
                    // It's the key in cardsData and affects the image filename.
                    // For now, we only update the display text, not the underlying data key or image.
                    // A full rename would require deleting the old key, adding a new one,
                    // and potentially handling image renaming/relinking.
                    console.warn(`Card name display updated to "${newValue}", but the underlying data key "${cardName}" and image link were NOT changed.`);
                    alert(`Name display updated to "${newValue}".\nFull rename (including data key and image) is not implemented.`);
                    element.textContent = newValue; // Update display only
                 }
            } else {
                 element.textContent = originalValue; // Revert if no change or empty
            }
        };

        input.addEventListener('blur', saveChanges);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger save
            } else if (e.key === 'Escape') {
                 element.textContent = originalValue; // Revert
                 input.removeEventListener('blur', saveChanges); // Prevent blur save on escape
                 input.blur(); // Lose focus
            }
        });
    }

    // --- Print Handler ---
    function handlePrintSelectedClick() {
        const selectedCheckboxes = cardContainer.querySelectorAll('.card-select-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            alert("Please select at least one card to print.");
            return;
        }

        let printHtmlContent = '';
        selectedCheckboxes.forEach(checkbox => {
            const cardElement = checkbox.closest('.card-template');
            const cardName = cardElement.dataset.cardName;
            if (cardName && cardsData.cards[cardName]) {
                // Get the HTML for the card, but remove the checkbox and remove button for printing
                let cardPrintHtml = getCardHtml(cardName, cardsData.cards[cardName]);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardPrintHtml;
                const checkboxToRemove = tempDiv.querySelector('.card-select-checkbox');
                const removeBtnToRemove = tempDiv.querySelector('.remove-card-btn');
                if (checkboxToRemove) checkboxToRemove.remove();
                if (removeBtnToRemove) removeBtnToRemove.remove();
                printHtmlContent += tempDiv.innerHTML; // Add the cleaned card HTML
            }
        });

        // Create the full HTML for the print window
        const printWindowHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Print Cards</title>
                <link rel="stylesheet" href="templates/card_style.css"> <!-- Base card styles -->
                <link rel="stylesheet" href="css/print.css"> <!-- Print-specific styles -->
            </head>
            <body>
                <div class="print-container">
                    ${printHtmlContent}
                </div>
            </body>
            </html>
        `;

        // Open a new window and write the content
        const printWindow = window.open('', '_blank');
        printWindow.document.open();
        printWindow.document.write(printWindowHtml);
        printWindow.document.close();

        // Wait for content to load before printing (important for images/styles)
        printWindow.onload = () => {
            printWindow.focus(); // Focus the window before printing
            printWindow.print();
            // Optional: Close window after print dialog is closed
            // printWindow.onafterprint = () => printWindow.close();
        };
    }


    // --- Height Adjustment ---
    function adjustCardHeights() {
        // Reset heights first to recalculate based on content
        const cards = cardContainer.querySelectorAll('.card-template');
        cards.forEach(card => {
            const imgContainer = card.querySelector('.card-image-container');
            const stats = card.querySelector('.card-stats');
            const costs = card.querySelector('.card-costs');
            if(imgContainer) imgContainer.style.minHeight = ''; // Reset minHeight
            if(stats) stats.style.minHeight = ''; // Reset minHeight
            if(costs) costs.style.minHeight = ''; // Reset minHeight
        });

        // Allow browser to reflow
        requestAnimationFrame(() => {
            // Find max heights for each section across all visible cards
            let maxImgHeight = 0;
            let maxStatsHeight = 0;
            let maxCostsHeight = 0;

            cards.forEach(card => {
                const imgContainer = card.querySelector('.card-image-container');
                const stats = card.querySelector('.card-stats');
                const costs = card.querySelector('.card-costs');
                if(imgContainer) maxImgHeight = Math.max(maxImgHeight, imgContainer.offsetHeight);
                if(stats) maxStatsHeight = Math.max(maxStatsHeight, stats.offsetHeight);
                if(costs) maxCostsHeight = Math.max(maxCostsHeight, costs.offsetHeight);
            });

             // Apply max heights to all cards
            cards.forEach(card => {
                const imgContainer = card.querySelector('.card-image-container');
                const stats = card.querySelector('.card-stats');
                const costs = card.querySelector('.card-costs');
                 // Set min-height instead of height to allow content to grow if needed,
                 // but ensure consistent alignment.
                // if(imgContainer) imgContainer.style.minHeight = `${maxImgHeight}px`; // REMOVED JS height setting for image
                // if(stats) stats.style.minHeight = `${maxStatsHeight}px`; // REMOVED JS height setting for stats
                // if(costs) costs.style.minHeight = `${maxCostsHeight}px`; // REMOVED JS height setting for costs
            });
        });
    }

    // --- Utility ---
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        // Corrected replacements
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }


    // --- Start the application ---
    init().then(() => {
        // Initial check for select all state after cards are loaded
        updateSelectAllCheckboxState();
    });

    // Adjust heights on window resize as well
    // window.addEventListener('resize', adjustCardHeights); // (Temporarily disabled for debugging)
});