document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const contactType = document.getElementById('contact-type');
    const ticketPriority = document.getElementById('ticket-priority');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            // Clear the form
            contactForm.reset();
            
            // Show success popup
            if (data.type === 'support') {
                showPopupMessage('Support ticket created successfully. We will contact you soon!');
            } else {
                showPopupMessage('Message sent successfully! Thank you for contacting us.');
            }
            
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


/*
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const contactType = document.getElementById('contact-type');
    const ticketPriority = document.getElementById('ticket-priority');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        const userEmail = data.email; // Store user's email for CC

        try {
            // Prepare email data
            const emailData = {
                to: 'help@recspicy.com',
                cc: userEmail,
                subject: `${data.category}: ${data.type} - ${data.firstName} ${data.lastName}`,
                message: `
                    Category: ${data.category}
                    Type: ${data.type}
                    Name: ${data.firstName} ${data.lastName}
                    Email: ${data.email}
                    Message: ${data.message}
                    ${data.type === 'support' ? `Priority: ${data.priority}` : ''}
                `
            };

            if (data.type === 'support') {
                const ticket = await createSupportTicket(data);
                await sendEmail(emailData);
                showSuccess('Support ticket created successfully. Ticket ID: ' + ticket.id);
            } else {
                await sendEmail(emailData);
                await submitContactForm(data);
                showSuccess('Message sent successfully');
            }
            
            dispatchDatabaseEvent('messageSubmitted', {
                type: data.type,
                priority: data.priority || 'normal'
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            showError('Failed to submit form. Please try again.');
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

async function sendEmail(emailData) {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            throw new Error('Failed to send email');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}  

// Using SendGrid's API
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

async function sendEmail(emailData) {
    try {
        const msg = {
            to: emailData.to,
            cc: emailData.cc,
            from: 'support@recspicy.com',
            subject: emailData.subject,
            text: emailData.message,
        };
        const response = await sgMail.send(msg);
        return response;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
*/