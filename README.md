# 🚚 LogiTrack — Supply Chain & Shipment Tracking System

<div align="center">

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=java&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6.2-6DB33F?style=for-the-badge&logo=spring-security&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)

**A full-stack, AI-powered shipment tracking platform with real-time notifications, role-based access control, and live data sync across all user sessions.**

</div>

---

## 📌 What is LogiTrack?

LogiTrack is a production-grade supply chain management system that allows **Admins**, **Vendors**, and **Customers** to manage and track shipments in real time. It features an AI support chatbot that understands your shipment data, live push notifications using Server-Sent Events (SSE), automated email alerts on status changes, and a complete audit trail for every shipment lifecycle event.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Stateless, token-based auth with BCrypt password hashing |
| 👥 **Role-Based Access Control** | Separate dashboards and permissions for Admin, Vendor, Customer |
| 📦 **Shipment Lifecycle Management** | Full status-transition tracking from CREATED → DELIVERED |
| 🤖 **AI Support Chatbot** | Powered by Spring AI + Groq API — answers questions using live DB data |
| 📡 **Real-Time SSE Sync** | All pages auto-refresh across every logged-in session without manual reload |
| 🔔 **Live Notifications** | Role-specific push notifications with click-through navigation |
| 📧 **Email Notifications** | Async email alerts to vendor and customer on every status update |
| 🗂️ **Audit Trail** | Every status change is recorded with timestamp, location, and actor |
| 🛡️ **Shipment Authorization** | Users can only access shipments they own — 403 on unauthorized access |
| 📊 **Admin Analytics** | Live charts showing delivery rates, vendor performance, monthly trends |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│   Dashboard │ Shipments │ Track │ Admin Panel │ Chatbot  │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API + SSE
┌─────────────────────▼───────────────────────────────────┐
│                 Spring Boot Backend                       │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Auth      │  │  Shipment    │  │  Notification  │  │
│  │ Controller  │  │  Controller  │  │   Controller   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│  ┌──────▼──────┐  ┌──────▼───────┐  ┌───────▼────────┐  │
│  │   Auth      │  │  Shipment    │  │  Notification  │  │
│  │  Service    │  │  Service     │  │   Service      │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│  ┌──────▼────────────────▼───────────────────▼────────┐  │
│  │              Spring Data JPA / Hibernate            │  │
│  └─────────────────────────┬───────────────────────────┘  │
│                            │                              │
│  ┌─────────────────────────▼───────────────────────────┐  │
│  │  Spring Security + JWT Filter Chain                  │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                     MySQL Database                        │
│   users │ shipments │ shipment_status_history            │
└─────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Chatbot — How It Works

The chatbot is not a generic assistant. Every time a user sends a message, the backend:

1. Fetches **live shipment data** from the database for that specific user
2. Builds a context-aware **system prompt** injecting real tracking numbers, statuses, and locations
3. Sends it to **Groq API (LLaMA 3.3 70B)** via Spring AI
4. Returns a role-specific, data-aware response

```
User: "Where is my package?"
         ↓
ChatController → ChatService
         ↓
Fetch shipments from DB for this user
         ↓
Build system prompt with live data
         ↓
Groq API (LLaMA 3.3) → generates response
         ↓
"Your shipment LGT-A1B2C3 is currently IN TRANSIT at Surat Hub, Gujarat."
```

---

## 📡 Real-Time Architecture (SSE)

```
Admin updates shipment status
         ↓
ShipmentService.updateStatus()
         ↓
NotificationService.sendToUser(customerId)   ← Customer gets notified
NotificationService.sendToUser(vendorId)     ← Vendor gets notified  
NotificationService.sendToAll()              ← Admins get notified
         ↓
Server-Sent Events push to all open browser tabs
         ↓
React NotifContext receives event
         ↓
All pages auto-refresh + bell icon updates instantly
```

---

## 🗄️ Database Schema

```sql
users
├── id, email, password, full_name, phone, role, created_at

shipments
├── id, tracking_number (UNIQUE), description
├── origin_address, destination_address, weight_kg
├── current_status, vendor_id (FK), customer_id (FK)
├── created_at, estimated_delivery, actual_delivery

shipment_status_history   ← Full audit trail
├── id, shipment_id (FK), status, location
├── remarks, updated_by (FK), changed_at
```

---

## 🔄 Shipment Lifecycle

```
CREATED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                     ↘ FAILED_DELIVERY → RETURNED → CANCELLED
```

---

## 🛠️ Tech Stack

### Backend
- **Java 17** + **Spring Boot 3.2**
- **Spring Security 6.2** — JWT stateless authentication
- **Spring Data JPA** + **Hibernate** — ORM and DB interactions
- **Spring AI** — AI chatbot integration
- **Spring Mail** — Async email notifications
- **Server-Sent Events (SSE)** — Real-time push to frontend
- **MySQL 8** — Relational database

### Frontend
- **React 18** + **React Router v6**
- **Vite** — Build tool with dev proxy
- **Axios** — API calls with JWT interceptor
- **EventSource API** — SSE connection for live sync

### AI & External
- **Groq API** (LLaMA 3.3 70B) — Free, fast AI inference
- **Spring AI** — Provider-agnostic AI abstraction layer

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- MySQL 8+
- Node.js 18+

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/DevPanchal2610/LogiTrack.git
cd LogiTrack/logitrack

# 2. Create MySQL database
mysql -u root -p
CREATE DATABASE logitrack_db;
exit

# 3. Configure application.properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
groq.api.key=your_groq_api_key     # Free at console.groq.com
spring.mail.username=your_email
spring.mail.password=your_app_password

# 4. Run
./mvnw spring-boot:run
```

### Frontend Setup

```bash
cd LogiTrack/logitrack-frontend

npm install
npm run dev
```

App runs at **http://localhost:3000** — backend at **http://localhost:8080**

---

## 📋 API Reference

### Auth (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (ADMIN / VENDOR / CUSTOMER) |
| POST | `/api/auth/login` | Login → returns JWT token |

### Shipments
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/shipments/create` | Vendor, Admin | Create shipment |
| PUT | `/api/shipments/{id}/status` | Vendor, Admin | Update status |
| GET | `/api/shipments/track/{trackingNo}` | Public | Track by tracking number |
| GET | `/api/shipments/my` | All | Get my shipments |
| GET | `/api/shipments/{id}` | Owner only | Get shipment detail |

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/message` | Send message → AI response with live DB context |

### Real-Time
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/subscribe` | Open SSE stream for live notifications |

### Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/shipments` | All shipments |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/analytics` | System analytics |

---

## 👥 Roles & Permissions

| Feature | Admin | Vendor | Customer |
|---|:---:|:---:|:---:|
| View all shipments | ✅ | ❌ | ❌ |
| Create shipment | ✅ | ✅ | ❌ |
| Update shipment status | ✅ | ✅ | ❌ |
| View own shipments | ✅ | ✅ | ✅ |
| Track by tracking number | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| View analytics | ✅ | ❌ | ❌ |
| AI Chatbot | ✅ | ✅ | ✅ |

---

## 📁 Project Structure

```
logitrack/
├── src/main/java/com/logitrack/
│   ├── config/          # Security configuration
│   ├── controller/      # REST controllers + SSE
│   ├── dto/             # Request/Response DTOs
│   ├── entity/          # JPA entities
│   ├── enums/           # Role, ShipmentStatus
│   ├── exception/       # Global exception handler
│   ├── repository/      # Spring Data repositories
│   ├── security/        # JWT filter + utils
│   └── service/         # Business logic
│       └── impl/
└── src/main/resources/
    └── application.properties

logitrack-frontend/
└── src/
    ├── components/      # Sidebar, Topbar, AI Chatbot
    ├── context/         # AuthContext, NotifContext (SSE)
    ├── hooks/           # useDataSync (live refresh)
    ├── pages/           # Dashboard, Shipments, Admin, Track
    └── services/        # Axios API + SSE stream
```

---

## 🙋 Author

**Dev Panchal**
- 📧 devpanchal2610@gmail.com
- 💼 [linkedin.com/in/dev-panchal2610](https://linkedin.com/in/dev-panchal2610)
- 🐙 [github.com/DevPanchal2610](https://github.com/DevPanchal2610)

---

<div align="center">
⭐ If you found this project useful, please give it a star!
</div>
