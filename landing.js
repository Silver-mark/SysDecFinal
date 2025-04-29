

document.addEventListener('DOMContentLoaded', () => {
    // Logo animation
    const introOverlay = document.getElementById('intro-overlay');
    const logoImage = document.getElementById('intro-logo');
    
    // Ease in logo
    setTimeout(() => {
        logoImage.classList.add('visible');
    }, 500);
    
    introOverlay.addEventListener('click', () => {
        introOverlay.classList.add('slide-up');
        document.body.classList.add('content-visible');
        setTimeout(() => {
            introOverlay.style.display = 'none';
        }, 1000);
    });



    document.querySelectorAll('a[href^="#"]').forEach(anchor => 
	{
        anchor.addEventListener('click', function (e) 
		{
            e.preventDefault();
            
			document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    const signInBtn = document.getElementById('signin-btn');
    const signUpBtn = document.getElementById('signup-btn');

    signInBtn.addEventListener('click', () => 
	{
        window.location.href = 'signin.html';
    });

    signUpBtn.addEventListener('click', () => 
	{
        window.location.href = 'signup.html';
    });
}); 
