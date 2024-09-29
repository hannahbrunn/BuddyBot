let currentStepIndex = 0;  // Track which question in the flow we're on
let currentOptions = {};  // Store current options
let userName = '';  // Global variable to store user's name
let ConversationFlow = []; // Initialize ConversationFlow
let autoScrollEnabled = true; // Control for auto-scrolling

// Load the questions from the CSV file
async function loadQuestions() {
  const response = await fetch("neutral_responses.csv"); // Update with your CSV file path
  const text = await response.text();
  
  const rows = text.split('\n').map(row => row.split(';')); // Change delimiter to your preferred one
  
  // Add number question you want the conversation to start (0 = the first question)
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const question = row[0].replace(/{Username}/g, userName); // Replace placeholder
    const options = {};
    let hasResponse = false; // Flag to check if there are responses
    
    for (let i = 1; i < row.length; i += 2) {
      if (row[i] && row[i + 1]) {
        options[row[i]] = { response: [row[i + 1]] }; // Each option and response
        hasResponse = true; // Mark as having a response
      }
    }

    if (hasResponse) {
      ConversationFlow.push({ question, options });
    } else {
      console.error(`Question "${question}" does not have any responses.`);
      ConversationFlow.push({ question, options: { "No response available": { response: ["I'm sorry, but there's no response available."] } } });
    }
  }
}

async function testAllPaths() {
  await loadQuestions(); // Ensure questions are loaded
  
  let currentStepIndex = 0;
  let pathsExplored = 0;

  while (currentStepIndex < ConversationFlow.length) {
    const currentStep = ConversationFlow[currentStepIndex];
    const options = currentStep.options;

    // Check if there are any options available for this question
    if (Object.keys(options).length === 0) {
      console.error(`No options available for question at index ${currentStepIndex}: "${currentStep.question}"`);
      break;
    }

    // Simulate choosing each option
    for (const option in options) {
      console.log(`Question: "${currentStep.question}"`);
      console.log(`User selects: "${option}"`);

      const response = options[option].response;

      // Log each response
      response.forEach((res, i) => {
        console.log(`Chatbot responds: "${res}"`);
      });

      pathsExplored++;
    }

    currentStepIndex++; // Move to the next question
  }

  if (currentStepIndex === ConversationFlow.length) {
    console.log(`All paths successfully explored. Total paths explored: ${pathsExplored}`);
  } else {
    console.error(`Stopped at question index: ${currentStepIndex}. Something went wrong.`);
  }
}

// Call the test function on page load or after questions are loaded
window.onload = testAllPaths;

// Ask the user for their name and move to the next question

function askUserName() {
  const conversation = document.getElementById('conversation');
  const buttons = document.getElementById('buttons');

  const introductionMessages = [
    "Hi, my name is BuddyBot.",
    "I will ask questions to get to know you better.",
    "What would you like me to call you?"
  ];

  // Show the introduction messages sequentially
  showMessagesSequentially(introductionMessages, () => {
    const nameInputHtml = `
      <div class="message user">
        <input type="text" id="userNameInput" placeholder="Enter your name" class="name-input">
      </div>
      <button class="chat-button" onclick="saveUserName()">Submit</button>
    `;
    buttons.innerHTML = nameInputHtml;
  });
}
// Save the user's name and update the conversation flow
function saveUserName() {
  const nameInput = document.getElementById('userNameInput');
  userName = nameInput.value.trim();  // Trim any extra spaces

  if (userName) {
    // Add the user's name as a message in the conversation
    const conversation = document.getElementById('conversation');
    conversation.innerHTML += `
      <div class="message user">
        <div class="bubble">${userName}</div>
      </div>
    `;

    // Remove the input box and submit button
    const buttons = document.getElementById('buttons');
    buttons.innerHTML = '';  // Clear the buttons container

    // Load the question data and proceed to the first question
    loadQuestions().then(() => {
      // Proceed with the first question
      currentOptions = ConversationFlow[currentStepIndex].options;
      showQuestionAndOptions();
    });
  } else {
    alert('Please enter your name.');
  }
}

// Show the current question and its options
function showQuestionAndOptions() {
  const currentStep = ConversationFlow[currentStepIndex];
  const conversation = document.getElementById('conversation');
  const buttons = document.getElementById('buttons');

  // Display the question
  showMessagesSequentially([currentStep.question], () => {
    // Once the question is shown, show the options as buttons if available
    if (Object.keys(currentStep.options).length > 0) {
      buttons.innerHTML = Object.keys(currentStep.options).map(option =>
        `<button class="chat-button" onclick="respond('${option}')">${option}</button>`
      ).join('');
    }
  });
}

// Handle the user's response
function respond(userInput) {
  const conversation = document.getElementById('conversation');
  const buttons = document.getElementById('buttons');

  // Get the current options based on the user input
  const userResponse = currentOptions[userInput];

  // Add the user's response to the chat
  conversation.innerHTML += `
      <div class="message user">
          <div class="bubble">${userInput}</div>
      </div>
  `;

  // Clear buttons
  buttons.innerHTML = '';

  if (userResponse) {
    // Get chatbot responses and split them based on punctuation
    const responses = userResponse.response.flatMap(response => response.split(/(?<=[.!?])\s+/)); // Split on punctuation followed by space

    // Show the chatbot's responses in sequence
    showMessagesSequentially(responses, () => {
      // Move to the next question in the flow
      currentStepIndex++;
      
      if (currentStepIndex < ConversationFlow.length) {
        currentOptions = ConversationFlow[currentStepIndex].options;
        showQuestionAndOptions();
      } else {
        // **End the conversation** by showing "Thanks for chatting!"
        showMessagesSequentially(["Thanks for chatting!"], () => {
          // Optionally, you can add additional actions here (e.g., resetting the conversation, hiding buttons)
          buttons.innerHTML = '';  // Clear buttons if needed
        });
      }
    });
  }
}

// Function to show multiple messages in sequence with typing animation
function showMessagesSequentially(messages, callback) {
  const conversation = document.getElementById('conversation');
  
  let index = 0;

  function showNextMessage() {
    if (index < messages.length) {
      // Create new bubble for the message part
      const bubble = document.createElement('div');
      bubble.classList.add('message', 'chatbot');
      bubble.innerHTML = `<img src="chatbot-profile.jpg" alt="Chatbot" class="chatbot-img"><div class="bubble"></div>`;
      conversation.appendChild(bubble);

      // Get the bubble div and type the message into it
      const bubbleText = bubble.querySelector('.bubble');
      
      // Typing effect
      typeMessage(bubbleText, messages[index], () => {
        index++;
        // Delay before the next message only after the current one finishes typing
        setTimeout(showNextMessage, 500); // Optional: Adjust delay time as needed
      });
    } else if (callback) {
      callback(); // When all messages are done, show buttons
    }
  }

  showNextMessage();
}

// Helper function for typing effect
function typeMessage(element, message, callback) {
  let index = 0;
  const interval = setInterval(() => {
    element.innerHTML += message.charAt(index);
    index++;
    if (index === message.length) {
      clearInterval(interval);
      if (callback) callback();  // Proceed after message finishes typing
      scrollToBottom(); // Scroll down when a message is fully displayed
    }
  }, 50); // Typing speed (50ms per character)
}

// Function to scroll to the bottom of the page
function scrollToBottom() {
  if (autoScrollEnabled) {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth' // Smooth scroll effect
    });
  }
}

// Function to check if the user scrolled up in the chatbox or window
function checkScrollPosition() {
  const chatBox = document.getElementById('conversation');
  
  // Check if the user is at the bottom of the chat container
  const isChatBoxAtBottom = chatBox.scrollHeight - chatBox.clientHeight <= chatBox.scrollTop + 1;

  // Check if the user is at the bottom of the window
  const isWindowAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1;
  
  // Auto-scroll will be disabled if the user scrolls up in either the chatbox or window
  autoScrollEnabled = isChatBoxAtBottom && isWindowAtBottom;
}

// Add event listener for the chat container scrolling
document.getElementById('conversation').addEventListener('scroll', checkScrollPosition);

// Add event listener for window scrolling
window.addEventListener('scroll', checkScrollPosition);

// Function to start auto-scrolling the window to the bottom every second
function autoScroll() {
  setInterval(() => {
    scrollToBottom();
  }, 100); // Adjust the interval time as needed (e.g., 1000ms = 1 second)
}

// Function to initialize chat on page load
async function initializeChat() {
  currentStepIndex = 0;  // Reset to first question
  currentOptions = {};  // Reset options
  askUserName();  // Start by asking for the user's name
  await loadQuestions(); // Ensure questions are loaded
  testAllPaths(); // Trigger the path-testing function
}

// Initialize chat on page load
window.onload = initializeChat;


