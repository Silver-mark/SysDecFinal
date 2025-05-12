document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const contactType = document.getElementById('contact-type');
    const ticketPriority = document.getElementById('ticket-priority');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            // Prepare email data
            const emailData = {
                from: data.email,
                to: 'contactrecspicy@gmail.com',
                subject: `${data.category}: ${data.type} - ${data.firstName} ${data.lastName}`,
                text: `
                    Category: ${data.category}
                    Type: ${data.type}
                    Name: ${data.firstName} ${data.lastName}
                    Email: ${data.email}
                    Message: ${data.message}
                    ${data.type === 'support' ? `Priority: ${data.priority}` : ''}
                `
            };

            // Send email using EmailJS
            await sendEmail(emailData);
            
            // Clear the form
            contactForm.reset();
            
            // Show success popup
            showPopupMessage('Message sent successfully! We will contact you soon.');
            
        } catch (error) {
            console.error('Error:', error);
            showPopupMessage('Failed to submit form. Please try again.', 'error');
        }
    });

    contactType.addEventListener('change', () => {
        ticketPriority.classList.toggle('hidden', contactType.value !== 'support');
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('type') === 'support') {
        contactType.value = 'support';
        ticketPriority.classList.remove('hidden');
    }
});


function showPopupMessage(message, type = 'success') {
    const popup = document.createElement('div');
    popup.className = `popup-message ${type}`;
    popup.innerHTML = `
        <div class="popup-content">
            <p>${message}</p>
            <button class="close-popup">×</button>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Add click event to close button
    const closeButton = popup.querySelector('.close-popup');
    closeButton.addEventListener('click', () => {
        popup.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(popup)) {
            popup.remove();
        }
    }, 5000);
}

async function sendEmail(emailData) {
    // Initialize EmailJS with your credentials
    emailjs.init('ePeevQ-t-aMk3cpGF');
    
    return emailjs.send('service_nohjgkh', 'template_puszrmc', {
        from_name: emailData.from,
        to_name: emailData.to,
        subject: emailData.subject,
        message: emailData.text
    });
}