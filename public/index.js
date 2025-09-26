document.addEventListener('DOMContentLoaded', () => {
    // Анимация сердечек
    const container = document.getElementById('heart-animation-container');
    if (container) {
        const numHearts = 20;
        for (let i = 0; i < numHearts; i++) {
            const heart = document.createElement('div');
            heart.classList.add('heart');
            const size = Math.random() * 20 + 10;
            heart.style.width = `${size}px`;
            heart.style.height = `${size}px`;
            heart.style.left = `${Math.random() * 100}%`;
            heart.style.animationDelay = `${Math.random() * 10}s`;
            heart.style.animationDuration = `${Math.random() * 10 + 10}s`;
            container.appendChild(heart);
        }
    }

    // Загрузка отзывов
    async function loadTestimonials() {
        try {
            const response = await fetch('/api/testimonials');
            const result = await response.json();
            const grid = document.getElementById('testimonials-grid');
            if (response.ok && result.testimonials.length > 0) {
                grid.innerHTML = ''; // Очищаем
                result.testimonials.forEach(item => {
                    const card = `
                        <div class="testimonial-card">
                            <p class="testimonial-text">"${item.testimonial_text}"</p>
                            <h4 class="testimonial-author">${item.author_name}</h4>
                            <p class="testimonial-date">${item.date}</p>
                        </div>
                    `;
                    grid.innerHTML += card;
                });
            } else {
                grid.innerHTML = '<p>No testimonials yet.</p>';
            }
        } catch (error) {
            console.error('Failed to load testimonials:', error);
            grid.innerHTML = '<p>Could not load testimonials.</p>';
        }
    }

    loadTestimonials();
});