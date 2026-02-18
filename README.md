# Smart Appointment & Client Management System

A lightweight Python web app for a massage training center or clinic that supports:

- Appointment booking by clients
- Secure client data storage in SQLite (protected fields)
- WhatsApp booking confirmation to clients
- WhatsApp notification to admin for new bookings

## Features

- **Booking page**: `GET /`
- **Create booking**: `POST /book`
- **Admin dashboard**: `GET /admin`
- **Appointments API**: `GET /api/appointments`

### Security model

Sensitive client fields (name, phone, email, notes) are stored in a protected encoded format using a key derived from `APP_ENCRYPTION_KEY`. 

> For production, replace this minimal mechanism with a robust cryptography library and add authentication to `/admin`.

## Environment

Copy `.env.example` and set values:

```bash
cp .env.example .env
```

- `APP_ENCRYPTION_KEY` (required)
- `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` (optional)
- `ADMIN_WHATSAPP_NUMBER` (optional)

If WhatsApp credentials are missing, the app logs simulated message output.

## Run

```bash
python app.py
```

Then open: `http://localhost:5000`
