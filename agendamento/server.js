import express from 'express';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import Pusher from 'pusher';

dotenv.config();

const app = express();
app.use(cors()); // Permitir CORS para qualquer origem
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const pusher = new Pusher({
    appId: '1853712',
    key: 'c5dc5b55973c301f7482',
    secret: 'bc2a1ea90bafa639584f',
    cluster: 'sa1',
    useTLS: true
});

app.post('/send-email', (req, res) => {
    const { name, phone, services, date, slot, endTime } = req.body;

    // Validação básica
    if (!name || !phone || !services || !date || !slot || !endTime) {
        return res.status(400).send('Dados insuficientes');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'pedrolhf06@gmail.com',
        subject: 'Novo Agendamento',
        text: `Novo agendamento:\n\nNome: ${name}\nTelefone: ${phone}\nServiços: ${services}\nData: ${date}\nHorário: ${slot}\nHora de término: ${endTime}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail:', error);
            res.status(500).send('Erro ao enviar e-mail');
        } else {
            console.log('E-mail enviado:', info.response);
            
            // Enviar notificação via Pusher
            pusher.trigger('agendamento-channel', 'novo-agendamento', {
                name,
                phone,
                services,
                date,
                slot,
                endTime
            });

            res.status(200).send('E-mail enviado e notificação enviada com sucesso');
        }
    });
});

app.post('/pusher-event', (req, res) => {
    const { event, date, bookings } = req.body;
    if (event === 'booking-updated') {
        pusher.trigger('calendar-channel', 'booking-updated', {
            date,
            bookings
        });
        res.status(200).send('Evento Pusher enviado com sucesso');
    } else {
        res.status(400).send('Evento Pusher não reconhecido');
    }
});

// Escutando na porta 3000 em todas as interfaces de rede
app.listen(3000, '0.0.0.0', () => {
    console.log('Servidor rodando na porta 3000');
});
