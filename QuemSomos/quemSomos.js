let slideIndex = 0;
let slides = document.querySelectorAll(".mySlides");

function showSlides() {
    for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
        slides[i].classList.remove("exit");
    }

    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }

    slides[slideIndex - 1].classList.add("active");
    slides[(slideIndex - 2 + slides.length) % slides.length].classList.add("exit");

    setTimeout(showSlides, 3000); // Muda a imagem a cada 4 segundos
}

function plusSlides(n) {
    slideIndex += n;
    if (slideIndex < 1) {
        slideIndex = slides.length;
    } else if (slideIndex > slides.length) {
        slideIndex = 1;
    }
    showSlides();
}

window.onload = showSlides;

function recarregarPagina() {
    window.location.reload();
}

document.querySelector('.localizacao').addEventListener('click', function (e) {
    e.preventDefault();
    scrollToSmoothly(document.documentElement.scrollHeight, 1700); // tempo de transição de descida (1000ms = 1 segundo)
});

function scrollToSmoothly(pos, duration) {
    const start = window.pageYOffset;
    const distance = pos - start;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, start, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

// Obter todos os botões de abrir modal
var openModalButtons = document.querySelectorAll('.open-modal');

// Obter todos os modais
var modals = document.querySelectorAll('.modal');

// Obter todos os botões de fechar modal
var closeButtons = document.querySelectorAll('.close');

// Função para abrir o modal
openModalButtons.forEach(button => {
    button.addEventListener('click', function() {
        var modalId = this.getAttribute('data-modal');
        var modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "block";
        }
    });
});

// Função para fechar o modal
closeButtons.forEach(button => {
    button.addEventListener('click', function() {
        var modalId = this.getAttribute('data-modal');
        var modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = "none";
        }
    });
});

// Fechar o modal quando clicar fora dele
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
});

