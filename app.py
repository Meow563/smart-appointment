import base64
import hashlib
import hmac
import html
import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from urllib import parse, request
from wsgiref.simple_server import make_server

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "appointments.db"

STYLE_CSS = """
:root {
  --bg: #f3f6ff;
  --card: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --line: #dbe2f0;
  --primary: #4f46e5;
  --primary-strong: #4338ca;
  --success: #166534;
  --success-bg: #dcfce7;
  --radius: 16px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  background: radial-gradient(1300px 800px at 90% -20%, #dfe8ff 0, #f3f6ff 45%, #f3f6ff 100%);
  color: var(--text);
}

.container {
  width: min(780px, 94vw);
  margin: 2.2rem auto;
}

.card {
  background: var(--card);
  border: 1px solid #edf0f7;
  border-radius: var(--radius);
  padding: 1.15rem;
  box-shadow: 0 14px 35px rgba(31, 41, 55, 0.08);
}
.form-card h2,
.panel-title {
  margin: 0 0 .8rem;
  font-size: 1.1rem;
}

form {
  display: grid;
  gap: .75rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
}

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
}

.field {
  display: grid;
  gap: .35rem;
}

.field span {
  font-size: .88rem;
  font-weight: 600;
}

.hint {
  color: var(--muted);
  font-size: .78rem;
}

input,
textarea,
select,
button {
  font: inherit;
  border-radius: 10px;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid var(--line);
  padding: .64rem .72rem;
  background: #fff;
}

input:focus,
textarea:focus,
select:focus {
  outline: 2px solid #c7d2fe;
  border-color: #a5b4fc;
}

button {
  cursor: pointer;
  border: 0;
  padding: .75rem 1rem;
  font-weight: 700;
  background: var(--primary);
  color: white;
  transition: .15s ease;
}
button:hover { background: var(--primary-strong); }

.subtle {
  color: var(--muted);
  font-size: .85rem;
}

.row {
  display: flex;
  gap: .7rem;
  align-items: center;
  flex-wrap: wrap;
}

.link {
  color: #4338ca;
  text-decoration: none;
  font-weight: 600;
}
.link:hover { text-decoration: underline; }

.table-wrap {
  overflow: auto;
  border: 1px solid #edf0f7;
  border-radius: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

th,
td {
  border-bottom: 1px solid #eef2f7;
  padding: .68rem;
  text-align: left;
  vertical-align: top;
  font-size: .9rem;
}

th {
  background: #f8faff;
  color: #4b5563;
  font-weight: 700;
  position: sticky;
  top: 0;
}

.status {
  display: inline-block;
  background: var(--success-bg);
  color: var(--success);
  border-radius: 999px;
  padding: .28rem .58rem;
  font-size: .76rem;
  font-weight: 700;
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 1.1rem;
}
""".strip()


def base_layout(title: str, content: str) -> str:
    return f"""<!doctype html>
<html lang='en'>
  <head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width,initial-scale=1'>
    <title>{html.escape(title)}</title>
    <link rel='stylesheet' href='/static/style.css'>
  </head>
  <body>{content}</body>
</html>"""


def home_page() -> str:
    body = """
<main class='container'>
  <section class='card form-card'>
    <h2>Book an appointment</h2>
    <form action='/book' method='post'>
      <div class='form-grid'>
        <label class='field'>
          <span>Full name *</span>
          <input type='text' name='name' autocomplete='name' required>
        </label>
        <label class='field'>
          <span>WhatsApp number *</span>
          <input type='tel' name='phone' placeholder='+15551234567' autocomplete='tel' required>
        </label>
      </div>

      <div class='form-grid'>
        <label class='field'>
          <span>Email</span>
          <input type='email' name='email' autocomplete='email' placeholder='optional'>
        </label>
        <label class='field'>
          <span>Service *</span>
          <select name='service' required>
            <option value=''>Select service</option>
            <option>Swedish Massage</option>
            <option>Deep Tissue Massage</option>
            <option>Sports Massage</option>
            <option>Student Practice Session</option>
          </select>
        </label>
      </div>

      <label class='field'>
        <span>Date & Time *</span>
        <input type='datetime-local' name='appointment_time' required>
      </label>

      <label class='field'>
        <span>Notes</span>
        <textarea name='notes' rows='3' placeholder='Pain points, injuries, or session goals (optional)'></textarea>
      </label>

      <button type='submit'>Book appointment</button>
      <div class='row'>
        <span class='subtle'>* Required fields</span>
        <a class='link' href='/admin'>Open admin dashboard</a>
      </div>
    </form>
  </section>
</main>
"""
    return base_layout("Book Appointment", body)


def thanks_page(booking_id: int) -> str:
    body = f"""
<main class='container'>
  <section class='card'>
    <span class='status'>Confirmed</span>
    <h1>Appointment booked successfully ✅</h1>
    <p>Your booking reference is <strong>#{booking_id}</strong>. A WhatsApp confirmation should arrive shortly.</p>
    <div class='row'>
      <a class='link' href='/'>Book another appointment</a>
      <a class='link' href='/admin'>View admin dashboard</a>
    </div>
  </section>
</main>
"""
    return base_layout("Appointment Confirmed", body)


def admin_page(appointments: list[dict]) -> str:
    if appointments:
        rows = "".join(
            f"<tr><td>{a['id']}</td><td>{html.escape(a['name'])}</td><td>{html.escape(a['phone'])}</td><td>{html.escape(a['email'])}</td><td>{html.escape(a['service'])}</td><td>{html.escape(a['appointment_time'])}</td><td>{html.escape(a['notes'])}</td><td>{html.escape(a['created_at'])}</td></tr>"
            for a in appointments
        )
    else:
        rows = "<tr><td colspan='8' class='empty'>No appointments yet.</td></tr>"

    body = f"""
<main class='container'>
  <section class='card'>
    <div class='row' style='justify-content:space-between;'>
      <div>
        <h1 class='panel-title'>Admin Dashboard</h1>
        <p class='subtle'>Latest bookings for your clinic team.</p>
      </div>
      <a class='link' href='/'>← Back to booking page</a>
    </div>

    <div class='table-wrap'>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Client</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Service</th>
            <th>Appointment Time</th>
            <th>Notes</th>
            <th>Created At (UTC)</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  </section>
</main>
"""
    return base_layout("Admin Dashboard", body)


def derive_key() -> bytes:
    secret = os.getenv("APP_ENCRYPTION_KEY", "dev-only-change-me")
    return hashlib.sha256(secret.encode()).digest()


def encrypt(text: str) -> str:
    if not text:
        return ""
    key = derive_key()
    raw = text.encode()
    out = bytes(raw[i] ^ key[i % len(key)] for i in range(len(raw)))
    sig = hmac.new(key, out, hashlib.sha256).digest()[:8]
    return base64.urlsafe_b64encode(sig + out).decode()


def decrypt(token: str) -> str:
    if not token:
        return ""
    try:
        key = derive_key()
        blob = base64.urlsafe_b64decode(token.encode())
        sig, data = blob[:8], blob[8:]
        if hmac.new(key, data, hashlib.sha256).digest()[:8] != sig:
            return "[invalid key]"
        raw = bytes(data[i] ^ key[i % len(key)] for i in range(len(data)))
        return raw.decode()
    except Exception:
        return "[unreadable]"


def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL,
            client_phone TEXT NOT NULL,
            client_email TEXT,
            service TEXT NOT NULL,
            appointment_time TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL
        )"""
    )
    conn.commit()
    conn.close()


def send_whatsapp_message(to: str, message: str) -> bool:
    token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    if not token or not phone_id:
        print(f"[WhatsApp simulation] To {to}: {message}")
        return False

    payload = json.dumps({"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": message}}).encode()
    req = request.Request(
        f"https://graph.facebook.com/v20.0/{phone_id}/messages",
        data=payload,
        method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with request.urlopen(req, timeout=10):
            return True
    except Exception as exc:
        print(f"[WhatsApp error] {exc}")
        return False


def save_appointment(data: dict) -> int:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO appointments (client_name, client_phone, client_email, service, appointment_time, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            encrypt(data.get("name", "")),
            encrypt(data.get("phone", "")),
            encrypt(data.get("email", "")),
            data.get("service", ""),
            data.get("appointment_time", ""),
            encrypt(data.get("notes", "")),
            datetime.utcnow().isoformat(timespec="seconds"),
        ),
    )
    rid = cur.lastrowid
    conn.commit()
    conn.close()
    return rid


def get_appointments() -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM appointments ORDER BY appointment_time ASC").fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "name": decrypt(r["client_name"]),
            "phone": decrypt(r["client_phone"]),
            "email": decrypt(r["client_email"]),
            "service": r["service"],
            "appointment_time": r["appointment_time"],
            "notes": decrypt(r["notes"]),
            "created_at": r["created_at"],
        }
        for r in rows
    ]


def html_response(start_response, body: str, status="200 OK", headers=None):
    hdrs = [("Content-Type", "text/html; charset=utf-8")]
    if headers:
        hdrs.extend(headers)
    start_response(status, hdrs)
    return [body.encode()]


def app(environ, start_response):
    path = environ.get("PATH_INFO", "/")
    method = environ.get("REQUEST_METHOD", "GET")

    if path == "/static/style.css":
        start_response("200 OK", [("Content-Type", "text/css; charset=utf-8")])
        return [STYLE_CSS.encode()]

    if path == "/" and method == "GET":
        return html_response(start_response, home_page())

    if path == "/book" and method == "POST":
        length = int(environ.get("CONTENT_LENGTH") or "0")
        body = environ["wsgi.input"].read(length).decode()
        form = parse.parse_qs(body)
        data = {k: v[0] for k, v in form.items()}
        for f in ("name", "phone", "service", "appointment_time"):
            if not data.get(f):
                start_response("400 Bad Request", [("Content-Type", "application/json")])
                return [json.dumps({"error": f"Missing {f}"}).encode()]

        booking_id = save_appointment(data)
        send_whatsapp_message(
            data["phone"],
            f"Hi {data['name']}, your appointment for {data['service']} is confirmed on {data['appointment_time']}.",
        )
        admin = os.getenv("ADMIN_WHATSAPP_NUMBER")
        if admin:
            send_whatsapp_message(
                admin,
                f"New booking #{booking_id}: {data['name']} booked {data['service']} at {data['appointment_time']}.",
            )

        return html_response(start_response, thanks_page(booking_id))

    if path == "/admin" and method == "GET":
        return html_response(start_response, admin_page(get_appointments()))

    if path == "/api/appointments" and method == "GET":
        start_response("200 OK", [("Content-Type", "application/json")])
        return [json.dumps(get_appointments()).encode()]

    start_response("404 Not Found", [("Content-Type", "text/plain")])
    return [b"Not found"]


if __name__ == "__main__":
    init_db()
    port = int(os.getenv("PORT", "5000"))
    print(f"Serving on http://0.0.0.0:{port}")
    with make_server("0.0.0.0", port, app) as server:
        server.serve_forever()
