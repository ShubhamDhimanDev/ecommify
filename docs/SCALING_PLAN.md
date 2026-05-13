# Scaling Plan — Future Microservices Architecture

This document outlines the **future evolution** of Ecommify from a monolithic Laravel API to a distributed microservices architecture, enabling independent scaling and team autonomy.

---

## 1. Current State (Phase 1)

### 1.1 Monolithic Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Laravel API (Monolithic)                      │
│           localhost:8000                                │
│  ┌─────────────────────────────────────────────────────┐│
│  │ All code in /api:                                   ││
│  │ - Authentication & Authorization                   ││
│  │ - Product Catalog Management                       ││
│  │ - Order Processing                                 ││
│  │ - Payment Integration                              ││
│  │ - Customer Management                              ││
│  │ - Inventory Management                             ││
│  │ - Notification System                              ││
│  │ - Analytics & Reporting                            ││
│  └─────────────────────────────────────────────────────┘│
│  Single Database: PostgreSQL                           │
│  Single Cache: Redis                                   │
└─────────────────────────────────────────────────────────┘

Pros:
✓ Single deployment unit
✓ ACID transactions across domains
✓ Simple debugging & monitoring
✓ Easier to build MVP

Cons:
✗ Hard to scale independently
✗ One bug can crash entire system
✗ Large codebase (hard to navigate)
✗ Teams must coordinate deployments
✗ Difficult to replace technologies
```

---

## 2. Phase 2: Microservices Extraction (6-12 months)

### 2.1 Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                │
│              (Routes requests to services)                       │
└────┬─────────────────────────┬──────────────────────┬───────────┘
     │                         │                      │
     ↓                         ↓                      ↓
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ User Service │    │ Store Service    │    │Product Service│
│ (Fiber/Go)   │    │ (Fiber/Go)       │    │ (Fiber/Go)   │
│              │    │                  │    │              │
│ - Auth       │    │ - Tenants        │    │ - Catalog    │
│ - Profiles   │    │ - Domains        │    │ - Categories │
│ - Sessions   │    │ - Settings       │    │ - Variants   │
│ Port: 8001   │    │ Port: 8002       │    │ Port: 8005   │
└──────────────┘    └──────────────────┘    └──────────────┘

     │                         │                      │
     ├─────────────────────────┼──────────────────────┤
     │                         │                      │
     ↓                         ↓                      ↓
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│Order Service │    │ Payment Service  │    │Inventory Svc │
│ (Fiber/Go)   │    │ (Fiber/Go)       │    │ (Fiber/Go)   │
│              │    │                  │    │              │
│ - Orders     │    │ - Gateways       │    │ - Stock      │
│ - Carts      │    │ - Transactions   │    │ - Operations │
│ - Checkout   │    │ - Webhooks       │    │ - Tracking   │
│ Port: 8003   │    │ Port: 8007       │    │ Port: 8006   │
└──────────────┘    └──────────────────┘    └──────────────┘

     │                         │
     ↓                         ↓
┌──────────────┐    ┌──────────────────┐
│Customer Svc  │    │Notification Svc  │
│ (Fiber/Go)   │    │ (Fiber/Go)       │
│              │    │                  │
│ - Customers  │    │ - Email          │
│ - Profiles   │    │ - SMS            │
│ - Reviews    │    │ - Webhooks       │
│ Port: 8008   │    │ Port: 8004       │
└──────────────┘    └──────────────────┘

All services:
- Database: PostgreSQL (shared or separate schemas)
- Cache: Redis (shared)
- Message Queue: Redis Streams or RabbitMQ
- Monitoring: Prometheus + Grafana
- Logging: ELK Stack
```

### 2.2 Technology Stack

| Service | Framework | Language | DB | Status |
|---------|-----------|----------|----|----|
| API Gateway | Kong / Nginx | Config | - | Phase 2 |
| User Service | Fiber | Go 1.25 | PostgreSQL | Phase 2 |
| Store Service | Fiber | Go 1.25 | PostgreSQL | Phase 2 |
| Product Service | Fiber | Go 1.25 | PostgreSQL | Phase 2 |
| Order Service | Fiber | Go 1.25 | PostgreSQL | Phase 2 |
| Payment Service | Fiber | Go 1.25 | PostgreSQL | Phase 2 |
| Inventory Service | Fiber | Go 1.25 | PostgreSQL | Phase 2 |
| Notification Service | Fiber | Go 1.25 | PostgreSQL | Phase 2 |
| Customer Service | Fiber | Go 1.25 | PostgreSQL | Phase 2 |

**Why Go + Fiber?**
- Lightweight & fast
- Easy async/concurrency
- Compiled binary (easy deployment)
- Perfect for microservices

---

## 3. Service Extraction Roadmap

### 3.1 Extraction Order (Priority)

**Phase 2.1: Foundation (Months 1-2)**
1. Extract **User Service** (auth is critical)
2. Extract **Store Service** (tenant management)
3. Extract **Notification Service** (async task runner)

**Phase 2.2: Commerce (Months 3-4)**
4. Extract **Product Service**
5. Extract **Order Service**
6. Extract **Customer Service**

**Phase 2.3: Advanced (Months 5-6)**
7. Extract **Payment Service** (most complex)
8. Extract **Inventory Service**
9. Extract **Analytics Service** (future)

### 3.2 Extraction Strategy

**Step 1: Replicate in Go**
```bash
# Create new Go service directory
mkdir backend/user-service
cd backend/user-service

# Initialize Go module
go mod init github.com/ecommify/user-service

# Copy database migration
# Replicate Laravel controllers/routes as Go handlers
```

**Step 2: Implement in Go (Fiber)**
```go
// backend/user-service/handlers/auth.go
package handlers

func Login(c *fiber.Ctx) error {
    // Replicate Laravel LoginController logic
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(ErrorResponse{Message: err.Error()})
    }

    // Validate credentials
    // Generate token
    // Return response

    return c.Status(200).JSON(fiber.Map{
        "access_token": token,
        "user": user,
    })
}
```

**Step 3: Dual Running**
```php
// Laravel acts as reverse proxy initially
// New requests go to Go service
// Old requests still handled by Laravel
// Gradually migrate traffic: 10% → 50% → 100%
```

**Step 4: Laravel Decommission**
```bash
# Once all services extracted
# Decommission Laravel gradually
# OR keep it as "legacy gateway" for period
```

---

## 4. Data Management Strategy

### 4.1 Database-per-Service (Eventually)

```
Current (Phase 1):
┌─────────────────────────────────┐
│   PostgreSQL (Shared)           │
│   - users                       │
│   - tenants                     │
│   - products                    │
│   - orders                      │
│   - etc.                        │
└─────────────────────────────────┘

Phase 2 (Transition):
┌─────────────────────────────────┐
│   PostgreSQL (Shared schema)    │
│   - public schema (central)     │
│   - user_service schema         │
│   - store_service schema        │
│   - product_service schema      │
│   - etc.                        │
└─────────────────────────────────┘

Phase 3 (Full Microservices):
┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│User Service  │  │Store Service│  │Product Service│
│DB: postgres-1│  │DB: postgres-2│  │DB: postgres-3│
└──────────────┘  └─────────────┘  └──────────────┘
```

### 4.2 Shared Data (Central Database)

Some data stays centralized:

```sql
-- Central schema (accessed by all services)
public.tenants              ← All services read
public.domains              ← Store Service writes, others read
public.permissions          ← User Service writes, others read
public.roles                ← User Service writes, others read

-- Service-specific schemas
user_service.users
user_service.sessions
user_service.api_tokens

store_service.store_settings
store_service.store_domains

product_service.products
product_service.categories
product_service.variants

order_service.orders
order_service.order_items
```

### 4.3 Data Consistency (Eventually Consistent)

Moving from ACID to Eventual Consistency:

```
Current (Monolithic):
User creates product → Immediate consistency check

Future (Microservices):
Product Service creates product
  ↓
Publishes: "ProductCreated" event
  ↓
Inventory Service receives event → Updates stock
  ↓
Search Service receives event → Indexes product
  ↓
Cart Service receives event → Updates availability

Each service processes event independently (Eventual Consistency)
```

---

## 5. Inter-Service Communication

### 5.1 Synchronous Communication (REST)

For immediate responses:

```go
// Order Service calling Inventory Service
resp, err := http.Post(
    "http://inventory-service:8006/api/v1/products/{id}/stock",
    "application/json",
    body,
)
```

**Risks:**
- Service dependency failures
- Cascading timeouts

**Mitigation:**
- Circuit breakers
- Timeouts
- Retry logic

### 5.2 Asynchronous Communication (Events)

For eventual consistency:

```go
// Product Service publishes event
event := ProductCreatedEvent{
    ProductID: "...",
    StoreID: "...",
    Name: "Nike Air Max",
    Price: 129.99,
}

eventBus.Publish("product.created", event)

// Other services listen
inventoryService.OnProductCreated(event)
searchService.OnProductCreated(event)
notificationService.OnProductCreated(event)
```

### 5.3 Message Queue (Redis Streams or RabbitMQ)

```yaml
# docker-compose.yml addition
redis-queue:
  image: redis:8-alpine
  ports:
    - "6380:6379"  # Separate from cache redis

# Or
rabbitmq:
  image: rabbitmq:3.12-management
  ports:
    - "5672:5672"
    - "15672:15672"
```

**Event Streams:**
```
product.created
product.updated
product.deleted
order.created
order.payment.received
payment.webhook.stripe
inventory.low_stock
```

---

## 6. API Gateway Pattern

### 6.1 Request Routing

```
Client Request
  ↓
API Gateway (Kong/Nginx)
  ├─ /api/v1/auth/* → routes to User Service
  ├─ /api/v1/stores/* → routes to Store Service
  ├─ /api/v1/products/* → routes to Product Service
  ├─ /api/v1/orders/* → routes to Order Service
  ├─ /api/v1/payments/* → routes to Payment Service
  ├─ /api/v1/inventory/* → routes to Inventory Service
  └─ /api/v1/customers/* → routes to Customer Service

Response
  ↓
Client
```

### 6.2 Kong Configuration

```yaml
# config/kong/kong.yml
services:
  - name: user-service
    url: http://user-service:8001
    routes:
      - paths:
        - /api/v1/auth
        - /api/v1/users

  - name: product-service
    url: http://product-service:8005
    routes:
      - paths:
        - /api/v1/products

  - name: order-service
    url: http://order-service:8003
    routes:
      - paths:
        - /api/v1/orders

# ... other services
```

### 6.3 Authentication at Gateway

```yaml
plugins:
  - name: jwt
    config:
      key_claim_name: "user_id"
      secret: ${JWT_SECRET}
    route: protected-routes
```

---

## 7. Deployment Strategy

### 7.1 Docker Containers

```dockerfile
# backend/user-service/Dockerfile
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o user-service main.go

FROM alpine:latest
COPY --from=builder /app/user-service /app/
EXPOSE 8001
CMD ["/app/user-service"]
```

### 7.2 Docker Compose Update

```yaml
# docker-compose.yml (Phase 2)
services:
  api-gateway:
    image: kong:latest
    ports:
      - "8000:8000"
    depends_on:
      - user-service
      - store-service
      - product-service

  user-service:
    build: ./backend/user-service
    ports:
      - "8001:8001"
    depends_on:
      - postgres
      - redis

  store-service:
    build: ./backend/store-service
    ports:
      - "8002:8002"
    depends_on:
      - postgres
      - redis

  # ... other services

  postgres:
    # Shared database
    ports:
      - "5432:5432"

  redis:
    # Shared cache
    ports:
      - "6379:6379"
```

### 7.3 Kubernetes Deployment (Production)

```yaml
# k8s/user-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: ecommify/user-service:latest
        ports:
        - containerPort: 8001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: postgres-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 10
```

---

## 8. Monitoring & Observability

### 8.1 Metrics (Prometheus)

```yaml
# Each service exposes /metrics
prometheus:
  image: prom/prometheus
  config:
    scrape_configs:
      - job_name: 'user-service'
        static_configs:
          - targets: ['user-service:8001']
      - job_name: 'product-service'
        static_configs:
          - targets: ['product-service:8005']
```

### 8.2 Logging (ELK Stack)

```yaml
# docker-compose.yml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch
  environment:
    - discovery.type=single-node

logstash:
  image: docker.elastic.co/logstash/logstash
  # Collects logs from all services

kibana:
  image: docker.elastic.co/kibana/kibana
  ports:
    - "5601:5601"
  # Visualize logs
```

### 8.3 Tracing (Jaeger)

```yaml
jaeger:
  image: jaegertracing/all-in-one
  ports:
    - "6831:6831/udp"  # Trace collection
    - "16686:16686"    # UI
```

**Usage in services:**
```go
// Trace a request across services
tracer.StartSpan("order-service:checkout")
  // Calls inventory-service
  tracer.StartSpan("inventory-service:reserve-stock")
// Visualize in Jaeger UI
```

---

## 9. Migration Checklist

### Phase 2.1: User Service Extraction

- [ ] Create Go project structure
- [ ] Replicate authentication logic in Go
- [ ] Create API endpoints
- [ ] Set up API Gateway routing
- [ ] Run Go service alongside Laravel
- [ ] Implement circuit breaker for Laravel fallback
- [ ] Gradual traffic migration (10% → 50% → 100%)
- [ ] Monitor error rates & performance
- [ ] Decommission Laravel auth routes

### Phase 2.2: Subsequent Services

- [ ] Replicate Store Service logic
- [ ] Replicate Product Service logic
- [ ] Implement event bus for inter-service communication
- [ ] Set up message queue
- [ ] Test eventual consistency scenarios
- [ ] Performance testing under load

### Phase 2.3: Production Readiness

- [ ] Implement service discovery
- [ ] Set up distributed tracing
- [ ] Configure monitoring & alerting
- [ ] Create runbooks for on-call engineers
- [ ] Chaos engineering tests
- [ ] Disaster recovery procedures

---

## 10. Team Structure (Future)

With microservices, teams own complete services:

```
Platform Team
├── User Service Team (2-3 engineers)
│   ├─ Frontend: Admin-Front auth components
│   ├─ Backend: User Service (Go)
│   └─ Database: user_service schema
│
├── Store Service Team (2-3 engineers)
│   ├─ Backend: Store Service (Go)
│   └─ Database: store_service schema
│
├── Product Service Team (2-3 engineers)
│   ├─ Backend: Product Service (Go)
│   └─ Database: product_service schema
│
├── Order & Payment Team (3-4 engineers)
│   ├─ Backend: Order Service (Go)
│   ├─ Backend: Payment Service (Go)
│   └─ Database: order_service schema
│
├── Inventory & Analytics Team (2-3 engineers)
│   ├─ Backend: Inventory Service (Go)
│   └─ Database: inventory_service schema
│
├── Frontend Team (3-4 engineers)
│   ├─ Admin-Front
│   ├─ Store-Front
│   └─ Shared Components
│
└── Infrastructure Team (2-3 engineers)
    ├─ Kubernetes
    ├─ Monitoring & Logging
    ├─ CI/CD
    └─ API Gateway
```

Each team:
- Owns one complete service (or component)
- Manages its own deployment
- Responsible for monitoring & alerts
- Can deploy independently (no coordination)

---

## 11. Cost Implications

### 11.1 Phase 1 (Current)

```
- 1 Laravel container: $20/mo
- 1 PostgreSQL instance: $30/mo
- 1 Redis instance: $10/mo
- 2 Next.js frontends: $5/mo (static hosting)
─────────────────────────────
Total: ~$65/month (for dev)
```

### 11.2 Phase 2 (Microservices)

```
- 8 Go microservices (2 replicas each): $160/mo
- 1 API Gateway: $30/mo
- 1 PostgreSQL instance: $50/mo (larger)
- 1 Redis instance (cache): $15/mo
- 1 Redis instance (queue): $15/mo
- Monitoring (Prometheus, ELK): $40/mo
- 2 Next.js frontends: $5/mo
─────────────────────────────
Total: ~$315/month (for dev)

Production costs (HA):
- 8 services (5 replicas): $400/mo
- Managed PostgreSQL: $200/mo
- RabbitMQ: $50/mo
- Monitoring & Logging: $100/mo
- Load Balancers: $50/mo
─────────────────────────────
Total: ~$800/month
```

---

## 12. Success Metrics

Phase 2 is successful when:

- ✅ Each service deploys independently (no coordination)
- ✅ Service A outage doesn't crash Service B (isolation)
- ✅ Product Service can scale 10x without scaling everything
- ✅ Teams ship features independently
- ✅ Average deployment time < 5 minutes
- ✅ Mean time to recovery (MTTR) < 15 minutes

---

## 13. Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Current system design
- [AGENTS.md](./AGENTS.md) — AI decision rules
- `/api/AGENTS.md` — Laravel-specific details

---

**Last Updated:** May 13, 2026  
**Version:** 1.0  
**Target Timeline:** Phase 2 begins Q4 2026
