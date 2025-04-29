document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('feedback-form');
    const starRatings = document.querySelectorAll('.star-rating');
    const ratings = {
        overall: 0,
        quality: 0,
        usability: 0
    };

    starRatings.forEach(ratingGroup => 
	{
        const category = ratingGroup.dataset.rating;
        const stars = ratingGroup.querySelectorAll('.star-btn');

        stars.forEach(star => 
		{
            star.addEventListener('click', () => 
			{
                const value = parseInt(star.dataset.value);
                ratings[category] = value;
                updateStars(stars, value);
            });

            star.addEventListener('mouseover', () => 
			{
                const value = parseInt(star.dataset.value);
                highlightStars(stars, value);
            });

            star.addEventListener('mouseout', () => 
			{
                updateStars(stars, ratings[category]);
            });
        });
    });

    function updateStars(stars, value) 
	{
        stars.forEach((star, index) => 
		{
            star.textContent = index < value ? '★' : '☆';
            star.classList.toggle('active', index < value);
        });
    }

    function highlightStars(stars, value) 
	{
        stars.forEach((star, index) => 
		{
            star.textContent = index < value ? '★' : '☆';
        });
    }
    feedbackForm.addEventListener('submit', async (e) => 
	{
        e.preventDefault();

        if (!ratings.overall) 
		{
            alert('Please provide an overall rating');
            return;
        }

        const formData = 
		{
            ratings: ratings,
            likes: feedbackForm.elements.likes.value,
            improvements: feedbackForm.elements.improvements.value,
            recommend: feedbackForm.elements.recommend.value
        };

        try 
		{
            console.log('Feedback data:', formData);
            alert('Thank you for your feedback!');
            feedbackForm.reset();
            Object.keys(ratings).forEach(key => 
			{
                ratings[key] = 0;
                const stars = document.querySelector(`[data-rating="${key}"]`).querySelectorAll('.star-btn');
                updateStars(stars, 0);
            });

            dispatchDatabaseEvent('feedbackSubmitted', 
			{
                messageId: 'new-feedback-id',
                type: 'feedback'
            });
        } 
		catch (error) 
		{
            console.error('Error submitting feedback:', error);
            alert('Failed to submit feedback. Please try again.');
        }
    });
}); 