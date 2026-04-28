// LearnedLeague Flashcards App
// Global state
let allQuestions = [];
let filteredQuestions = [];
let currentQuestion = null;
let availableSeasons = [];
let availableCategories = [];

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadQuestionsFromCSV();
});

// Load and parse CSV file
async function loadQuestionsFromCSV() {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const flashcardContainer = document.getElementById('flashcard-container');

    try {
        // Fetch the CSV file
        const response = await fetch('learnedleague_questions.csv');

        if (!response.ok) {
            throw new Error('Failed to load CSV file');
        }

        const csvText = await response.text();

        // Parse CSV
        allQuestions = parseCSV(csvText);

        if (allQuestions.length === 0) {
            throw new Error('No questions found in CSV file');
        }

        // Extract unique seasons and categories for filters
        availableSeasons = [...new Set(allQuestions.map(q => q.Season))].sort((a, b) => b - a);
        availableCategories = [...new Set(allQuestions.map(q => q.Category))].filter(c => c).sort();

        // Initialize filters
        populateFilters();

        // Start with all questions
        filteredQuestions = [...allQuestions];

        // Update UI
        updateQuestionCounter();
        loadingState.classList.add('hidden');
        flashcardContainer.classList.remove('hidden');

        // Load first question
        loadNextQuestion();

    } catch (error) {
        console.error('Error loading questions:', error);
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
}

// Simple CSV parser
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const questions = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV with quoted fields
        const values = parseCSVLine(line);

        if (values.length === headers.length) {
            const question = {};
            headers.forEach((header, index) => {
                question[header] = values[index];
            });
            questions.push(question);
        }
    }

    return questions;
}

// Parse a single CSV line (handles quoted fields)
function parseCSVLine(line) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Handle escaped quotes
                currentValue += '"';
                i++;
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // End of field
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            currentValue += char;
        }
    }

    // Add the last value
    values.push(currentValue.trim());

    return values;
}

// Populate filter dropdowns
function populateFilters() {
    const seasonFilter = document.getElementById('season-filter');
    const categoryFilter = document.getElementById('category-filter');

    // Populate seasons
    availableSeasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season;
        option.textContent = `Season ${season}`;
        seasonFilter.appendChild(option);
    });

    // Populate categories
    availableCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Load next random question
function loadNextQuestion() {
    if (filteredQuestions.length === 0) {
        alert('No questions match the current filters!');
        return;
    }

    // Get random question
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    currentQuestion = filteredQuestions[randomIndex];

    // Update UI
    displayQuestion(currentQuestion);
    hideAnswer();
}

// Display question on the card
function displayQuestion(question) {
    document.getElementById('category').textContent = question.Category || 'General';
    document.getElementById('meta').textContent =
        `Season ${question.Season} • Match ${question.Match} • ${question.Question_Number}`;
    document.getElementById('question-text').textContent = question.Question;
    document.getElementById('answer-text').textContent = question.Answer;

    // Handle additional content
    const additionalContentContainer = document.getElementById('additional-content-container');
    additionalContentContainer.innerHTML = '';

    if (question.Additional_Content && question.Additional_Content.trim()) {
        const url = question.Additional_Content.trim();
        const contentDiv = document.createElement('div');
        contentDiv.className = 'additional-content-link';

        // Check if it's an image
        if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Additional content';
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            img.style.marginTop = '15px';
            contentDiv.appendChild(img);
        } else {
            // Show as a link
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = '📎 View additional content';
            link.style.display = 'inline-block';
            link.style.marginTop = '15px';
            contentDiv.appendChild(link);
        }

        additionalContentContainer.appendChild(contentDiv);
    }
}

// Toggle answer visibility
function toggleAnswer() {
    const answerSide = document.getElementById('answer-side');
    const showAnswerBtn = document.getElementById('show-answer-btn');

    if (answerSide.classList.contains('hidden')) {
        // Show answer
        answerSide.classList.remove('hidden');
        showAnswerBtn.textContent = 'Hide Answer';
    } else {
        // Hide answer
        answerSide.classList.add('hidden');
        showAnswerBtn.textContent = 'Show Answer';
    }
}

// Hide answer (reset state)
function hideAnswer() {
    const answerSide = document.getElementById('answer-side');
    const showAnswerBtn = document.getElementById('show-answer-btn');

    answerSide.classList.add('hidden');
    showAnswerBtn.textContent = 'Show Answer';
}

// Toggle filters panel
function toggleFilters() {
    const filters = document.getElementById('filters');
    const icon = document.getElementById('filters-icon');

    if (filters.classList.contains('hidden')) {
        filters.classList.remove('hidden');
        icon.textContent = '▲';
    } else {
        filters.classList.add('hidden');
        icon.textContent = '▼';
    }
}

// Apply filters
function applyFilters() {
    const seasonFilter = document.getElementById('season-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;

    filteredQuestions = allQuestions.filter(q => {
        const matchesSeason = !seasonFilter || q.Season == seasonFilter;
        const matchesCategory = !categoryFilter || q.Category === categoryFilter;
        return matchesSeason && matchesCategory;
    });

    updateQuestionCounter();

    // Load a new question from filtered set
    if (filteredQuestions.length > 0) {
        loadNextQuestion();
    }
}

// Reset filters
function resetFilters() {
    document.getElementById('season-filter').value = '';
    document.getElementById('category-filter').value = '';
    applyFilters();
}

// Update question counter
function updateQuestionCounter() {
    const counter = document.getElementById('question-counter');
    const total = allQuestions.length;
    const filtered = filteredQuestions.length;

    if (filtered === total) {
        counter.textContent = `${total.toLocaleString()} questions loaded`;
    } else {
        counter.textContent = `${filtered.toLocaleString()} of ${total.toLocaleString()} questions`;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space or Enter to toggle answer
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        toggleAnswer();
    }
    // Arrow keys for next question
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        loadNextQuestion();
    }
});
