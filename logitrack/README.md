# LogiTrack – Shipment & Supply Chain Tracking API

A production-grade RESTful backend for real-time shipment tracking with role-based access control,
JWT authentication, full audit trail, and automated email notifications.

**Tech Stack:** Java 17 · Spring Boot 3.2 · Spring Security · JWT · Spring Data JPA · MySQL · Lombok

---

## Features

- **Role-Based Access Control** — ADMIN, VENDOR, CUSTOMER with method-level security
- **JWT Authentication** — stateless, token-based auth with BCrypt password hashing
- **Shipment Lifecycle Management** — full status-transition enforcement (CREATED → DELIVERED)
- **Complete Audit Trail** — every status change is recorded with timestamp, location, and actor
- **Async Email Notifications** — customers and vendors notified on every status update
- **Layered Architecture** — Controller → Service → Repository pattern throughout
- **Global Exception Handling** — structured error responses for all failure scenarios

---

## Project Structure

```
src/main/java/com/logitrack/
├── config/
│   └── SecurityConfig.java          # Spring Security + JWT filter chain
├── controller/
│   ├── AuthController.java          # /api/auth/** (public)
│   ├── ShipmentController.java      # /api/shipments/**
│   └── AdminController.java         # /api/admin/** (ADMIN only)
├── dto/
│   ├── RegisterRequest.java
│   ├── LoginRequest.java
│   ├── AuthResponse.java
│   ├── CreateShipmentRequest.java
│   ├── UpdateStatusRequest.java
│   ├── ShipmentResponse.java
│   ├── StatusHistoryResponse.java
│   └── ApiResponse.java             # Generic wrapper for all responses
├── entity/
│   ├── User.java                    # Implements UserDetails
│   ├── Shipment.java
│   └── ShipmentStatusHistory.java   # Audit trail table
├── enums/
│   ├── Role.java                    # ADMIN, VENDOR, CUSTOMER
│   └── ShipmentStatus.java          # CREATED → DELIVERED lifecycle
├── exception/
│   ├── ResourceNotFoundException.java
│   ├── BadRequestException.java
│   └── GlobalExceptionHandler.java  # @RestControllerAdvice
├── repository/
│   ├── UserRepository.java
│   ├── ShipmentRepository.java
│   └── ShipmentStatusHistoryRepository.java
├── security/
│   ├── JwtUtils.java                # Token generation & validation
│   └── JwtAuthenticationFilter.java # OncePerRequestFilter
└── service/
    ├── AuthService.java
    ├── ShipmentService.java
    ├── EmailNotificationService.java # @Async email dispatch
    └── impl/
        ├── AuthServiceImpl.java
        ├── ShipmentServiceImpl.java
        └── UserDetailsServiceImpl.java
```

---

## Setup

### Prerequisites
- Java 17+
- MySQL 8+
- Maven 3.8+

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/DevPanchal2610/LogiTrack.git
   cd LogiTrack
   ```

2. **Create MySQL database**
   ```sql
   CREATE DATABASE logitrack_db;
   ```

3. **Configure `application.properties`**
   ```properties
   spring.datasource.username=your_mysql_username
   spring.datasource.password=your_mysql_password
   spring.mail.username=your_email@gmail.com
   spring.mail.password=your_app_password
   ```

4. **Run the application**
   ```bash
   mvn spring-boot:run
   ```
   The API will be available at `http://localhost:8080`

---

## API Reference

### Auth Endpoints (Public)

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

**Register Request Body:**
```json
{
  "fullName": "Dev Panchal",
  "email": "dev@example.com",
  "password": "secret123",
  "phone": "9316510025",
  "role": "VENDOR"
}
```

**Login Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "email": "dev@example.com",
    "role": "VENDOR",
    "fullName": "Dev Panchal"
  }
}
```

> Use the token as: `Authorization: Bearer <token>`

---

### Shipment Endpoints

| Method | URL | Role Required | Description |
|--------|-----|---------------|-------------|
| POST | `/api/shipments/create` | VENDOR, ADMIN | Create new shipment |
| PUT | `/api/shipments/{id}/status` | VENDOR, ADMIN | Update shipment status |
| GET | `/api/shipments/track/{trackingNumber}` | Public | Track by tracking number |
| GET | `/api/shipments/{id}` | Authenticated | Get shipment by ID |
| GET | `/api/shipments/my` | Authenticated | Get my shipments |
| DELETE | `/api/shipments/{id}` | ADMIN | Delete shipment |

**Create Shipment:**
```json
{
  "description": "Electronics - Laptop",
  "originAddress": "123 Warehouse Lane, Mumbai",
  "destinationAddress": "456 Customer Street, Ahmedabad",
  "weightKg": 2.5,
  "customerId": 3,
  "estimatedDelivery": "2026-03-25T10:00:00"
}
```

**Update Status:**
```json
{
  "newStatus": "IN_TRANSIT",
  "location": "Surat Hub, Gujarat",
  "remarks": "Package picked up and in transit"
}
```

**Track Response includes full history:**
```json
{
  "trackingNumber": "LGT-A1B2C3D4E5F6",
  "currentStatus": "IN_TRANSIT",
  "statusHistory": [
    { "status": "CREATED", "location": "Mumbai Warehouse", "changedAt": "2026-03-20T09:00:00" },
    { "status": "PICKED_UP", "location": "Mumbai Hub", "changedAt": "2026-03-20T14:00:00" },
    { "status": "IN_TRANSIT", "location": "Surat Hub", "changedAt": "2026-03-21T08:00:00" }
  ]
}
```

---

### Admin Endpoints (ADMIN only)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/admin/shipments` | Get all shipments |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/users/vendors` | Get all vendors |
| GET | `/api/admin/users/customers` | Get all customers |
| DELETE | `/api/admin/users/{id}` | Delete a user |

---

## Shipment Status Lifecycle

```
CREATED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                     ↘ FAILED_DELIVERY → RETURNED → CANCELLED
```

---

## Database Schema

```
users                          shipments
-----                          ---------
id (PK)                        id (PK)
email (UNIQUE)                 tracking_number (UNIQUE)
password                       description
full_name                      origin_address
phone                          destination_address
role (ADMIN/VENDOR/CUSTOMER)   weight_kg
created_at                     current_status
                               vendor_id (FK → users)
                               customer_id (FK → users)
                               created_at
                               estimated_delivery
                               actual_delivery

shipment_status_history
-----------------------
id (PK)
shipment_id (FK → shipments)
status
location
remarks
updated_by (FK → users)
changed_at
```
