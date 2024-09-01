document.addEventListener('DOMContentLoaded', () => {
    const calendar = document.getElementById('calendar');
    const calendarTitle = document.getElementById('monthYear');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    const timeSlots = document.getElementById('timeSlots');
    const closeTimeSlots = document.getElementById('closeTimeSlots');
    const appointmentModal = document.getElementById('appointmentModal');
    const closeAppointmentModal = document.getElementById('closeAppointmentModal');
    const appointmentForm = document.getElementById('appointmentForm');
    const slotsList = document.getElementById('slotsList');
    const confirmationModal = document.getElementById('confirmationModal');
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const closeConfirmationModal = document.getElementById('closeConfirmationModal');
    const closeDeleteConfirmationModal = document.getElementById('closeDeleteConfirmationModal');
    const okConfirmation = document.getElementById('okConfirmation');
    const confirmDelete = document.getElementById('confirmDelete');
    const cancelDelete = document.getElementById('cancelDelete');

    let currentDate = new Date();
    const today = new Date();
    const bookedDates = JSON.parse(localStorage.getItem('bookedDates')) || {};

    const serviceDurations = {
        'Cabelo': 30,
        'Sobrancelha': 10,
        'Barba': 15
    };

    // Inicializa o Pusher
    const pusher = new Pusher('c5dc5b55973c301f7482', {
        cluster: 'sa1',
        encrypted: true
    });

    // Inscreva-se no canal e evento
    const channel = pusher.subscribe('calendar-channel');
    channel.bind('booking-updated', function(data) {
        bookedDates[data.date] = data.bookings;
        renderCalendar();
    });

    function renderCalendar() {
        calendar.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        calendarTitle.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();

        const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const headerRow = document.createElement('div');
        headerRow.classList.add('day-header');
        dayHeaders.forEach(day => {
            const dayCell = document.createElement('div');
            dayCell.textContent = day;
            headerRow.appendChild(dayCell);
        });
        calendar.appendChild(headerRow);

        for (let i = 0; i < startDay; i++) {
            const emptyCell = document.createElement('div');
            calendar.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            dayCell.textContent = day;
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            dayCell.dataset.date = dateStr;

            const cellDate = new Date(year, month, day);

            if (cellDate < today && !(dateStr === '2024-7-31')) {
                dayCell.classList.add('past-day');
            } else if (cellDate.getTime() === today.getTime()) {
                dayCell.classList.add('current-day');
                dayCell.addEventListener('click', () => {
                    showTimeSlots(day, true);
                });
            } else {
                dayCell.addEventListener('click', () => {
                    showTimeSlots(day);
                });
            }

            calendar.appendChild(dayCell);
        }
    }

    function showTimeSlots(day, isToday = false) {
        const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        slotsList.innerHTML = '';

        let startHour = 8;
        let startMinute = 0;

        const dateBookings = bookedDates[dateStr] || {};

        while (startHour < 18) {
            const slot = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
            const slotItem = document.createElement('li');
            const isBooked = Object.keys(dateBookings).some(bookingSlot => bookingSlot === slot);

            if (isBooked) {
                const booking = dateBookings[slot];
                const endTime = calculateEndTime(slot, booking.services);
                slotItem.innerHTML = `${slot} - ${endTime}: <span class="booked-label">OCUPADO</span>`;
                slotItem.classList.add('booked');

                [startHour, startMinute] = endTime.split(':').map(Number);
            } else if (isToday && (startHour < today.getHours() || (startHour === today.getHours() && startMinute < today.getMinutes()))) {
                slotItem.innerHTML = `${slot}: <span class="disabled-label">NÃO DISPONÍVEL</span>`;
                slotItem.classList.add('disabled');
            } else {
                slotItem.textContent = `${slot}: DISPONÍVEL`;
                slotItem.classList.add('available');
                slotItem.addEventListener('click', () => {
                    appointmentModal.style.display = 'block';
                    appointmentForm.dataset.date = dateStr;
                    appointmentForm.dataset.slot = slot;
                });

                startMinute += 60;
                if (startMinute >= 60) {
                    startHour += 1;
                    startMinute -= 60;
                }
            }

            slotsList.appendChild(slotItem);
        }

        timeSlots.style.display = 'block';
    }     

    function calculateEndTime(startTime, services) {
        let [startHour, startMinute] = startTime.split(':').map(Number);
        let totalMinutes = 0;

        services.forEach(service => {
            totalMinutes += serviceDurations[service] || 0;
        });

        startMinute += totalMinutes;
        if (startMinute >= 60) {
            startHour += Math.floor(startMinute / 60);
            startMinute %= 60;
        }

        return `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    }

    function saveBooking(dateStr, slot, booking) {
        const url = 'http://192.168.1.107:3000/pusher-event';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event: 'booking-updated',
                date: dateStr,
                bookings: {
                    ...bookedDates[dateStr],
                    [slot]: booking
                }
            })
        })
        .then(response => response.text())
        .then(data => {
            console.log('Evento Pusher enviado com sucesso:', data);
            bookedDates[dateStr] = {
                ...bookedDates[dateStr],
                [slot]: booking
            };
            localStorage.setItem('bookedDates', JSON.stringify(bookedDates));
        })
        .catch(error => {
            console.error('Erro ao enviar evento Pusher:', error);
        });
    }

    function sendEmail(booking) {
        const url = 'http://192.168.1.107:3000/send-email';

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(booking)
        })
        .then(response => response.text())
        .then(data => {
            console.log('Email enviado com sucesso:', data);
        })
        .catch(error => {
            console.error('Erro ao enviar e-mail:', error);
        });
    }

    function handleFormSubmit(event) {
        event.preventDefault();

        const dateStr = appointmentForm.dataset.date;
        const slot = appointmentForm.dataset.slot;

        if (!dateStr || !slot) {
            console.error('Data ou horário não encontrados');
            return;
        }

        const nameField = appointmentForm.querySelector('#name');
        const phoneField = appointmentForm.querySelector('#phone');
        const servicesField = appointmentForm.querySelector('#services');

        if (!nameField || !phoneField || !servicesField) {
            console.error('Formulário ou campos do formulário não encontrados');
            return;
        }

        const name = nameField.value.trim();
        const phone = phoneField.value.trim();
        const services = servicesField.value.split(',').map(service => service.trim());
        const endTime = calculateEndTime(slot, services);

        if (!name || !phone || services.length === 0) {
            console.error('Dados do formulário insuficientes');
            return;
        }

        const booking = {
            name,
            phone,
            services,
            date: dateStr,
            slot,
            endTime
        };

        saveBooking(dateStr, slot, booking);
        sendEmail(booking);
        appointmentModal.style.display = 'none';
    }

    // Event listeners
    prevMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    closeTimeSlots.addEventListener('click', () => {
        timeSlots.style.display = 'none';
    });

    closeAppointmentModal.addEventListener('click', () => {
        appointmentModal.style.display = 'none';
    });

    closeConfirmationModal.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });

    closeDeleteConfirmationModal.addEventListener('click', () => {
        deleteConfirmationModal.style.display = 'none';
    });

    okConfirmation.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });

    confirmDelete.addEventListener('click', () => {
        deleteConfirmationModal.style.display = 'none';
        // Adicione lógica para confirmar a exclusão
    });

    cancelDelete.addEventListener('click', () => {
        deleteConfirmationModal.style.display = 'none';
    });

    appointmentForm.addEventListener('submit', handleFormSubmit);

    renderCalendar();
});
