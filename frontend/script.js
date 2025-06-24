// Character data
const characters = {
    girlfriend: [
        {
            name: "Love Quinn",
            description: "Passionate and intense, with a heart full of devotion",
            avatar: "💕"
        },
        {
            name: "Caroline Forbes",
            description: "Bubbly and optimistic, always sees the bright side",
            avatar: "🌟"
        },
        {
            name: "Hermione Granger",
            description: "Brilliant and loyal, your perfect study companion",
            avatar: "📚"
        },
        {
            name: "Gwen Stacy",
            description: "Witty superhero with a caring heart",
            avatar: "🕷️"
        }
    ],
    boyfriend: [
        {
            name: "Joe Goldberg",
            description: "Mysterious bookworm with poetic soul",
            avatar: "📖"
        },
        {
            name: "Aaron Warner",
            description: "Cold exterior hiding a romantic heart",
            avatar: "⚡"
        },
        {
            name: "Steve Harrington",
            description: "Former popular kid with genuine heart",
            avatar: "🏆"
        },
        {
            name: "Damon Salvatore",
            description: "Charming bad boy with hidden depths",
            avatar: "🌙"
        }
    ]
};

// Page initialization
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    switch(currentPage) {
        case 'index.html':
        case '':
            initIndexPage();
            break;
        case 'select-character.html':
            initSelectCharacterPage();
            break;
        case 'chat.html':
            initChatPage();
            break;
        case 'venting.html':
            initVentingPage();
            break;
    }
});

// Index page functionality
function initIndexPage() {
    const companionCards = document.querySelectorAll('.companion-card');

    companionCards.forEach(card => {
        card.addEventListener('click', () => {
            const gender = card.dataset.gender;
            const action = card.dataset.action;

            if (action === 'venting') {
                // Add loading state
                card.classList.add('loading');
                
                // Navigate to venting page
                setTimeout(() => {
                    window.location.href = 'venting.html';
                }, 300);
            } else if (gender) {
                localStorage.setItem('selectedGender', gender);

                // Add loading state
                card.classList.add('loading');

                // Navigate to character selection
                setTimeout(() => {
                    window.location.href = 'select-character.html';
                }, 300);
            }
        });

        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-12px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Character selection page functionality
function initSelectCharacterPage() {
    const selectedGender = localStorage.getItem('selectedGender');

    if (!selectedGender) {
        window.location.href = 'index.html';
        return;
    }

    // Update tagline
    const tagline = document.getElementById('selection-tagline');
    tagline.textContent = `Choose Your AI ${selectedGender === 'girlfriend' ? 'Girlfriend' : 'Boyfriend'}`;

    // Populate characters
    const charactersGrid = document.getElementById('characters-grid');
    const characterList = characters[selectedGender];

    charactersGrid.innerHTML = '';

    characterList.forEach(character => {
        const characterCard = createCharacterCard(character);
        charactersGrid.appendChild(characterCard);
    });
}

function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.innerHTML = `
        <div class="character-avatar">${character.avatar}</div>
        <h3>${character.name}</h3>
        <p class="character-description">${character.description}</p>
    `;

    card.addEventListener('click', () => {
        localStorage.setItem('selectedCharacter', character.name);
        localStorage.setItem('selectedAvatar', character.avatar);

        // Add selection animation
        card.style.transform = 'scale(0.95)';
        card.style.opacity = '0.8';

        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 200);
    });

    return card;
}

// Enhanced Chat page functionality
function initChatPage() {
    const selectedCharacter = localStorage.getItem('selectedCharacter');
    const selectedAvatar = localStorage.getItem('selectedAvatar');

    if (!selectedCharacter) {
        window.location.href = 'index.html';
        return;
    }

    // Setup character info - with null checks
    const characterNameEl = document.getElementById('character-name');
    const characterAvatarEl = document.getElementById('character-avatar');
    const welcomeCharacterNameEl = document.getElementById('welcome-character-name');
    const welcomeAvatarEl = document.getElementById('welcome-avatar');
    const typingAvatarEl = document.getElementById('typing-avatar');
    
    if (characterNameEl) characterNameEl.textContent = selectedCharacter;
    if (characterAvatarEl) characterAvatarEl.textContent = selectedAvatar;
    if (welcomeCharacterNameEl) welcomeCharacterNameEl.textContent = selectedCharacter;
    if (welcomeAvatarEl) welcomeAvatarEl.textContent = selectedAvatar;
    if (typingAvatarEl) typingAvatarEl.textContent = selectedAvatar;

    // Setup chat functionality with null checks
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const typingIndicator = document.getElementById('typing-indicator');
    const typingStatus = document.getElementById('typing-status');
    const charCount = document.getElementById('char-count');
    
    if (!messageInput || !sendButton || !messagesContainer) {
        console.error('Required chat elements not found');
        return;
    }

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';

        // Update character count if element exists
        const count = messageInput.value.length;
        if (charCount) {
            charCount.textContent = count;
            charCount.style.color = count > 900 ? 'var(--accent-red)' : 'var(--text-muted)';
        }
    });

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Quick action buttons
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
        action.addEventListener('click', () => {
            const text = action.dataset.text;
            messageInput.value = text;
            messageInput.focus();
            messageInput.dispatchEvent(new Event('input'));
        });
    });

    // Enhanced send message function
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || sendButton.disabled) return;

        // Disable input and show loading
        setInputState(true);

        // Add user message with animation
        addMessage(message, 'user');
        messageInput.value = '';
        messageInput.style.height = 'auto';
        if (charCount) charCount.textContent = '0';

        // Show typing indicator
        showTypingIndicator();

        try {
            console.log('Sending request to /generate with:', { message, selectedCharacter });
            
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: message,
                    character: selectedCharacter
                })
            });

            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(data.error || 'Too many requests. Please wait a moment.');
                }
                throw new Error(data.error || 'Failed to get response');
            }

            // Hide typing indicator
            hideTypingIndicator();

            // Add bot response
            if (data.response) {
                addMessage(data.response, 'bot');
            } else {
                throw new Error('No response received from server');
            }

        } catch (error) {
            hideTypingIndicator();

            let errorMessage = 'Sorry, I encountered an error. Please try again.';
            if (error.message.includes('Too many requests') || error.message.includes('rate limit')) {
                errorMessage = 'I need a moment to catch my breath! Please wait a bit before sending another message. 💭';
            } else if (error.message.includes('overloaded')) {
                errorMessage = 'I\'m a bit overwhelmed right now. Please try again in a few seconds! 😅';
            }

            addMessage(errorMessage, 'bot');
            console.error('Error:', error);
        } finally {
            // Re-enable input
            setInputState(false);
        }
    }

    function setInputState(disabled) {
        messageInput.disabled = disabled;
        sendButton.disabled = disabled;

        if (disabled) {
            sendButton.classList.add('loading');
            if (typingStatus) typingStatus.style.display = 'inline';
        } else {
            sendButton.classList.remove('loading');
            if (typingStatus) typingStatus.style.display = 'none';
            messageInput.focus();
        }
    }

    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;

        messagesContainer.appendChild(messageDiv);

        // Smooth scroll to bottom
        setTimeout(() => {
            messagesContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end' 
            });
        }, 100);

        // Add read receipt for user messages (optional)
        if (sender === 'user') {
            setTimeout(() => {
                // Could add read receipt indicator here
            }, 1000);
        }
    }

    function showTypingIndicator() {
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            setTimeout(() => {
                typingIndicator.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end' 
                });
            }, 100);
        }
    }

    function hideTypingIndicator() {
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    // Focus on input when page loads
    setTimeout(() => {
        messageInput.focus();
    }, 500);

    // Add welcome message animation
    setTimeout(() => {
        const welcomeSection = document.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.style.opacity = '0';
            welcomeSection.style.transform = 'translateY(20px)';
            welcomeSection.style.transition = 'all 0.6s ease';

            setTimeout(() => {
                welcomeSection.style.opacity = '1';
                welcomeSection.style.transform = 'translateY(0)';
            }, 200);
        }
    }, 100);
}

// Utility functions
function goBack() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    switch(currentPage) {
        case 'select-character.html':
            window.location.href = 'index.html';
            break;
        case 'chat.html':
            window.location.href = 'select-character.html';
            break;
        default:
            window.history.back();
    }
}

// Enhanced background effects
function initBackgroundEffects() {
    // Floating hearts animation
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        heart.style.animationDelay = `${index * 3}s`;
        heart.style.left = `${10 + index * 20}%`;
    });

    // Gradient orbs movement
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, index) => {
        orb.style.animationDelay = `${index * 7}s`;
    });
}

// Initialize background effects on chat page
if (window.location.pathname.includes('chat.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initBackgroundEffects, 1000);
    });
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add ripple effect styles
const rippleStyles = `
.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

// Inject ripple styles
const styleSheet = document.createElement('style');
styleSheet.textContent = rippleStyles;
document.head.appendChild(styleSheet);

// Venting page functionality
function initVentingPage() {
    const ventInput = document.getElementById('vent-input');
    const burnButton = document.getElementById('burn-button');
    const responseSection = document.getElementById('response-section');
    const responseContent = document.getElementById('response-content');
    const responseAvatar = document.getElementById('response-avatar');
    const burnAnotherBtn = document.getElementById('burn-another');

    // Enable/disable burn button based on input
    ventInput.addEventListener('input', () => {
        const hasContent = ventInput.value.trim().length > 0;
        burnButton.disabled = !hasContent;
    });

    // Handle burn button click
    burnButton.addEventListener('click', async () => {
        const ventText = ventInput.value.trim();
        if (!ventText) return;

        // Disable button and show loading
        burnButton.disabled = true;
        burnButton.classList.add('loading');

        // Apply burn effect to the textarea
        ventInput.classList.add('burning');
        
        // Add burning particles
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'burning-particles';
        
        // Create multiple particles
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particlesContainer.appendChild(particle);
        }
        
        // Add smoke effect
        const smokeEffect = document.createElement('div');
        smokeEffect.className = 'smoke-effect';
        
        // Position particles and smoke relative to the textarea
        ventInput.parentElement.style.position = 'relative';
        ventInput.parentElement.appendChild(particlesContainer);
        ventInput.parentElement.appendChild(smokeEffect);

        // Wait for burn animation to complete
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Clear the input after burn effect
        ventInput.value = '';
        ventInput.classList.remove('burning');
        
        // Remove particle and smoke effects
        const existingParticles = ventInput.parentElement.querySelector('.burning-particles');
        const existingSmoke = ventInput.parentElement.querySelector('.smoke-effect');
        if (existingParticles) existingParticles.remove();
        if (existingSmoke) existingSmoke.remove();

        try {
            // Get a random character for the response
            const allCharacters = [...characters.girlfriend, ...characters.boyfriend];
            const randomCharacter = allCharacters[Math.floor(Math.random() * allCharacters.length)];

            const response = await fetch('/generate-vent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ventText: ventText,
                    character: randomCharacter.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            // Show the response
            responseAvatar.textContent = randomCharacter.avatar;
            responseContent.textContent = data.response;
            responseSection.style.display = 'block';

        } catch (error) {
            console.error('Error:', error);
            responseAvatar.textContent = '💭';
            responseContent.textContent = 'I hear you, and I want you to know that sharing takes courage. Sometimes the most healing thing is just letting it out. You did good. ❤️';
            responseSection.style.display = 'block';
        } finally {
            // Re-enable button
            burnButton.disabled = false;
            burnButton.classList.remove('loading');
        }
    });

    // Handle "burn another" button
    burnAnotherBtn.addEventListener('click', () => {
        responseSection.style.display = 'none';
        ventInput.focus();
    });

    // Focus on input when page loads
    setTimeout(() => {
        ventInput.focus();
    }, 500);
}