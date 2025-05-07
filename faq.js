/**
 * Toggle FAQ answer visibility and rotate arrow indicator
 * @param {HTMLElement} button - The FAQ question button that was clicked
 */
function toggleFAQ(button) {
    // Find the answer element (next sibling after the button)
    const answer = button.nextElementSibling;
    
    // Find the arrow element inside the button
    const arrow = button.querySelector('.question-arrow');
    
    // Toggle the visibility class on the answer
    answer.classList.toggle('visible');
    
    // Toggle the rotated class on the arrow
    arrow.classList.toggle('rotated');
}