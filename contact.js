document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const contactType = document.getElementById('contact-type');
    const ticketPriority = document.getElementById('ticket-priority');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            if (data.type === 'support') {
                const ticket = await createSupportTicket(data);
                showSuccess('Support ticket created successfully. Ticket ID: ' + ticket.id);
            } 
			else {
                
				await submitContactForm(data);
                showSuccess('Message sent successfully');
            }
            dispatchDatabaseEvent('messageSubmitted', {
                type: data.type,
                priority: data.priority || 'normal'
            });

        } 
		catch (error) {
            console.error('Error submitting form:', error);
            showError('Failed to submit form. Please try again.');
        }
    });

    contactType.addEventListener('change', () => {
        ticketPriority.classList.toggle('hidden', contactType.value !== 'support');
    });
    const urlParams = new URLSearchParams(window.location.search);
    
	if (urlParams.get('type') === 'support') 
	{
        contactType.value = 'support';
        ticketPriority.classList.remove('hidden');
    }
});

async function handleContactSubmission(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        if (data.type === 'support') {

            const ticket = await createSupportTicket(data);
            showSuccess('Support ticket created successfully. Ticket ID: ' + ticket.id);
        } 
		else 
		{
            await submitContactForm(data);
            showSuccess('Message sent successfully');
        }

        dispatchDatabaseEvent('messageSubmitted', {
            type: data.type,
            priority: data.priority || 'normal'
        });

    } 
	catch (error) 
	{
        console.error('Error submitting form:', error);
        showError('Failed to submit form. Please try again.');
    }
} 