// API Configuration
const API_URL = 'https://smile-dental-care.preview.emergentagent.com/api';

// Services Data
const services = [
    {
        title: 'İmplant Tedavisi',
        description: 'Eksik dişleriniz için kalıcı ve doğal görünümlü çözümler sunuyoruz.',
        icon: '🦷'
    },
    {
        title: 'Ortodonti',
        description: 'Diş teli ve şeffaf plak ile gülüşünüzü düzeltiyoruz.',
        icon: '😁'
    },
    {
        title: 'Diş Beyazlatma',
        description: 'Profesyonel beyazlatma ile dişlerinizi birkaç ton açın.',
        icon: '✨'
    },
    {
        title: 'Kanal Tedavisi',
        description: 'Ağrısız kanal tedavisi ile dişlerinizi kurtarıyoruz.',
        icon: '🔬'
    },
    {
        title: 'Zirkonyum Kaplama',
        description: 'Estetik ve dayanıklı zirkonyum kaplamalar ile mükemmel gülüş.',
        icon: '💎'
    },
    {
        title: 'Çocuk Diş Hekimliği',
        description: 'Çocuklarınızın diş sağlığı için özel yaklaşım ve sevgi dolu hizmet.',
        icon: '👶'
    }
];

// Testimonials Data
const testimonials = [
    {
        name: 'Ayşe Yılmaz',
        rating: 5,
        comment: 'Dr. Ahmet Bey ile tanıştığıma çok memnunum. İmplant tedavim harika geçti, hiç ağrı hissetmedim. Tüm ekip çok ilgili ve profesyonel.',
        date: '2 hafta önce'
    },
    {
        name: 'Mehmet Demir',
        rating: 5,
        comment: 'Yıllardır gittiğim en iyi diş hekimi. Kliniği çok temiz ve modern. Ortodonti tedavim sürecinde sürekli bilgilendirme yapıldı.',
        date: '1 ay önce'
    },
    {
        name: 'Zeynep Kaya',
        rating: 5,
        comment: 'Diş beyazlatma işlemi sonucu harika! Gülüşümden çok memnunum. Herkese tavsiye ediyorum.',
        date: '3 hafta önce'
    },
    {
        name: 'Can Özdemir',
        rating: 5,
        comment: 'Çocuğum diş hekiminden korkuyordu ama Dr. Ahmet Bey sayesinde artık severek gidiyor. Çok teşekkür ederiz!',
        date: '1 hafta önce'
    }
];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    renderServices();
    renderTestimonials();
    initMobileMenu();
    initSmoothScroll();
    initAppointmentForm();
});

// Render Services
function renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;
    
    grid.innerHTML = services.map((service, index) => `
        <div class="service-card" data-testid="service-card-${index}">
            <span class="service-icon">${service.icon}</span>
            <h3 class="service-title">${service.title}</h3>
            <p class="service-description">${service.description}</p>
            <a href="#appointment" class="service-link" data-testid="service-learn-more-${index}">
                Detaylı Bilgi
                <i data-lucide="chevron-right"></i>
            </a>
        </div>
    `).join('');
    
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Render Testimonials
function renderTestimonials() {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;
    
    grid.innerHTML = testimonials.map((testimonial, index) => {
        const stars = '<svg class="star-filled" data-testid="star-' + index + '" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'.repeat(testimonial.rating);
        
        return `
            <div class="testimonial-card" data-testid="testimonial-card-${index}">
                <div class="testimonial-stars">${stars}</div>
                <p class="testimonial-comment">"${testimonial.comment}"</p>
                <div>
                    <div class="testimonial-author">${testimonial.name}</div>
                    <div class="testimonial-date">${testimonial.date}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Mobile Menu
function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('navMenu');
    const menuIcon = document.getElementById('menuIcon');
    const closeIcon = document.getElementById('closeIcon');
    
    if (!toggle || !menu) return;
    
    toggle.addEventListener('click', function() {
        menu.classList.toggle('active');
        
        if (menu.classList.contains('active')) {
            menuIcon.style.display = 'none';
            closeIcon.style.display = 'block';
        } else {
            menuIcon.style.display = 'block';
            closeIcon.style.display = 'none';
        }
        
        // Reinitialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
    
    // Close menu when clicking on a link
    const navLinks = menu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            menu.classList.remove('active');
            menuIcon.style.display = 'block';
            closeIcon.style.display = 'none';
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    });
}

// Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80; // navbar height
                const targetPosition = target.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll to Section
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offset = 80;
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Open WhatsApp
function openWhatsApp() {
    window.open('https://wa.me/905551234567?text=Merhaba, randevu almak istiyorum.', '_blank');
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 4000);
}

// Appointment Form
function initAppointmentForm() {
    const form = document.getElementById('appointmentForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            date: document.getElementById('date').value,
            message: document.getElementById('message').value.trim()
        };
        
        // Validation
        if (!formData.name || !formData.phone || !formData.email || !formData.date) {
            showToast('Lütfen tüm zorunlu alanları doldurun.', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showToast('Lütfen geçerli bir e-posta adresi girin.', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Randevu oluşturulamadı');
            }
            
            const data = await response.json();
            
            showToast('Randevunuz başarıyla oluşturuldu! En kısa sürede size dönüş yapacağız.', 'success');
            
            // Reset form
            form.reset();
            
        } catch (error) {
            console.error('Appointment error:', error);
            showToast('Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        }
    });
}

// Intersection Observer for Animations
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observe sections
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.6s ease';
        observer.observe(section);
    });
}
