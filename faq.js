function toggleFAQ(button) {
    const answer = button.nextElementSibling;
    const arrow = button.querySelector('.question-arrow');
    answer.classList.toggle('visible');
    arrow.classList.toggle('rotated');
    const allAnswers = document.querySelectorAll('.faq-answer');
    const allArrows = document.querySelectorAll('.question-arrow');
    
    allAnswers.forEach(item => 
	{
        if (item !== answer && item.classList.contains('visible')) 
		{
            item.classList.remove('visible');
        }
    });
    
    allArrows.forEach(item => {
        if (item !== arrow && item.classList.contains('rotated')) 
		{
            item.classList.remove('rotated');
        }
    });
}

document.addEventListener('keydown', (e) => 
{
    if (e.key === 'Escape') {
        const visibleAnswers = document.querySelectorAll('.faq-answer.visible');
        const rotatedArrows = document.querySelectorAll('.question-arrow.rotated');
        
        visibleAnswers.forEach(answer => answer.classList.remove('visible'));
        rotatedArrows.forEach(arrow => arrow.classList.remove('rotated'));
    }
}); 