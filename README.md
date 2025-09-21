![Project Status](https://img.shields.io/badge/status-WIP-orange?style=for-the-badge)

# 🏪 Shoply

A scalable RESTful eCommerce 🛒 backend API built with `Node.js`, `Express`, and `PostgreSQL`. Supports **product management**, **JWT-based authentication**, **order processing**, **payment integration** `(Stripe)`, and **Redis caching** for high performance. Containerized with **Docker** 🚢 for easy deployment.



## 🚀 Progress so far

### ⌛ Completed
- **Authentication** (`signup`, `login`, `verify-email`, `reset password`) 🔐   
- **Middlewares** - `adminMiddleware`, `sellerMiddleware`, `adminOrSellerMiddleware`
- Product **CRUD**
- **Pagination** for fetching all products, to handle server load and keep it responsive.
- **Dockerization** 🚢 
- **Background Jobs** for sending emails.

### ⏳ Ongoing
- **User** routes
- **Proudct Image upload** in `AWS S3` using `workers`

## 🛠️ Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white) 
![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white) 
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) 
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white) 
![Drizzle ORM](https://img.shields.io/badge/Drizzle-3D6DB0?logo=drizzle&logoColor=white) 
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) 
![BullMQ](https://img.shields.io/badge/BullMQ-FF0000?logo=redis&logoColor=white) 
![JWT](https://img.shields.io/badge/JWT-black?logo=jsonwebtokens&logoColor=white) 
![Zod](https://img.shields.io/badge/Zod-2D3748?logo=typescript&logoColor=white) 
![bcrypt](https://img.shields.io/badge/bcrypt-008080?logo=security&logoColor=white) 
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?logo=amazonaws&logoColor=white)

---

## ⚗️ Modules

- 🔑 **Authentication & Authorization**  
  - User `registration` and `verification`, `login` and `reset-password`   
  - token based authentication with `JWT` for session management
  - Role-based access control (`customer`, `admin`, `seller`)  
  - routes ~ `/register`, `/verify-email`, `/login`, `/forgot-password`, `/reset-password`

---

### 🪧 I will add description for other modules and rest of the documentation eventually.
