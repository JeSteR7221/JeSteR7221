from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'lumina-pos-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# WebSocket Manager for Real-time Kitchen Display
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, branch_id: str):
        await websocket.accept()
        if branch_id not in self.active_connections:
            self.active_connections[branch_id] = []
        self.active_connections[branch_id].append(websocket)

    def disconnect(self, websocket: WebSocket, branch_id: str):
        if branch_id in self.active_connections:
            if websocket in self.active_connections[branch_id]:
                self.active_connections[branch_id].remove(websocket)

    async def broadcast_to_branch(self, branch_id: str, message: dict):
        if branch_id in self.active_connections:
            for connection in self.active_connections[branch_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# Create the main app
app = FastAPI(title="Lumina POS API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== ENUMS ====================
class UserRole(str, Enum):
    ADMIN = "admin"
    CASHIER = "cashier"
    KITCHEN = "kitchen"

class OrderType(str, Enum):
    DINE_IN = "dine_in"
    TAKEAWAY = "takeaway"
    DELIVERY = "delivery"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    SPLIT = "split"

# ==================== MODELS ====================

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
    branch_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Branch Models
class BranchBase(BaseModel):
    name: str
    address: str
    phone: str
    tax_rate: float = 18.0
    currency: str = "TRY"
    is_active: bool = True

class BranchCreate(BranchBase):
    pass

class Branch(BranchBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Category Models
class CategoryBase(BaseModel):
    name: str
    name_en: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    branch_id: str
    sort_order: int = 0
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Product Models
class ProductBase(BaseModel):
    name: str
    name_en: str
    description: Optional[str] = None
    description_en: Optional[str] = None
    price: float
    category_id: str
    branch_id: str
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    total_sold: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Table Models
class TableBase(BaseModel):
    number: int
    name: str
    capacity: int = 4
    branch_id: str
    is_occupied: bool = False
    is_active: bool = True

class TableCreate(TableBase):
    pass

class Table(TableBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    current_order_id: Optional[str] = None

# Order Item Models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    notes: Optional[str] = None

# Order Models
class OrderBase(BaseModel):
    branch_id: str
    table_id: Optional[str] = None
    table_number: Optional[int] = None
    order_type: OrderType = OrderType.DINE_IN
    items: List[OrderItem] = []
    subtotal: float = 0
    tax_amount: float = 0
    total: float = 0
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: int = 0
    status: OrderStatus = OrderStatus.PENDING
    cashier_id: Optional[str] = None
    cashier_name: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    payment_details: Optional[dict] = None
    is_paid: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

# Payment Models
class PaymentCreate(BaseModel):
    order_id: str
    payment_method: PaymentMethod
    cash_amount: Optional[float] = None
    card_amount: Optional[float] = None
    change_amount: Optional[float] = None

# Settings Models
class BusinessSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "global_settings"
    business_name: str = "Lumina Restaurant"
    business_address: str = ""
    business_phone: str = ""
    business_email: str = ""
    tax_number: str = ""
    default_tax_rate: float = 18.0
    currency: str = "TRY"
    default_language: str = "tr"
    receipt_footer: str = "Teşekkür ederiz!"

# QR Order Models
class QROrderCreate(BaseModel):
    branch_id: str
    table_id: str
    items: List[OrderItem]
    customer_notes: Optional[str] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str, branch_id: Optional[str] = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "branch_id": branch_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_roles(allowed_roles: List[UserRole]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in [r.value for r in allowed_roles]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=dict)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = hash_password(user.password)
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.insert_one(user_dict)
    del user_dict["password"]
    del user_dict["_id"] if "_id" in user_dict else None
    return {"message": "User created successfully", "user": user_dict}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User account is disabled")
    
    token = create_token(user["id"], user["email"], user["role"], user.get("branch_id"))
    user_data = {k: v for k, v in user.items() if k != "password"}
    return TokenResponse(access_token=token, user=user_data)

@api_router.get("/auth/me", response_model=dict)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================== USER ROUTES ====================

@api_router.get("/users", response_model=List[dict])
async def get_users(current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.put("/users/{user_id}", response_model=dict)
async def update_user(user_id: str, update_data: dict, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User updated successfully"}

@api_router.delete("/users/{user_id}", response_model=dict)
async def delete_user(user_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ==================== BRANCH ROUTES ====================

@api_router.post("/branches", response_model=dict)
async def create_branch(branch: BranchCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    branch_dict = branch.model_dump()
    branch_dict["id"] = str(uuid.uuid4())
    branch_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.branches.insert_one(branch_dict)
    del branch_dict["_id"] if "_id" in branch_dict else None
    return branch_dict

@api_router.get("/branches", response_model=List[dict])
async def get_branches(current_user: dict = Depends(get_current_user)):
    branches = await db.branches.find({}, {"_id": 0}).to_list(100)
    return branches

@api_router.get("/branches/{branch_id}", response_model=dict)
async def get_branch(branch_id: str, current_user: dict = Depends(get_current_user)):
    branch = await db.branches.find_one({"id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@api_router.put("/branches/{branch_id}", response_model=dict)
async def update_branch(branch_id: str, update_data: dict, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.branches.update_one({"id": branch_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Branch not found")
    return {"message": "Branch updated successfully"}

@api_router.delete("/branches/{branch_id}", response_model=dict)
async def delete_branch(branch_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.branches.delete_one({"id": branch_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Branch not found")
    return {"message": "Branch deleted successfully"}

# ==================== CATEGORY ROUTES ====================

@api_router.post("/categories", response_model=dict)
async def create_category(category: CategoryCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    cat_dict = category.model_dump()
    cat_dict["id"] = str(uuid.uuid4())
    cat_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.categories.insert_one(cat_dict)
    del cat_dict["_id"] if "_id" in cat_dict else None
    return cat_dict

@api_router.get("/categories", response_model=List[dict])
async def get_categories(branch_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if branch_id:
        query["branch_id"] = branch_id
    categories = await db.categories.find(query, {"_id": 0}).sort("sort_order", 1).to_list(100)
    return categories

@api_router.put("/categories/{category_id}", response_model=dict)
async def update_category(category_id: str, update_data: dict, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.categories.update_one({"id": category_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category updated successfully"}

@api_router.delete("/categories/{category_id}", response_model=dict)
async def delete_category(category_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ==================== PRODUCT ROUTES ====================

@api_router.post("/products", response_model=dict)
async def create_product(product: ProductCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    prod_dict = product.model_dump()
    prod_dict["id"] = str(uuid.uuid4())
    prod_dict["total_sold"] = 0
    prod_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(prod_dict)
    del prod_dict["_id"] if "_id" in prod_dict else None
    return prod_dict

@api_router.get("/products", response_model=List[dict])
async def get_products(
    branch_id: Optional[str] = None,
    category_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if branch_id:
        query["branch_id"] = branch_id
    if category_id:
        query["category_id"] = category_id
    if is_active is not None:
        query["is_active"] = is_active
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}", response_model=dict)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.put("/products/{product_id}", response_model=dict)
async def update_product(product_id: str, update_data: dict, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated successfully"}

@api_router.delete("/products/{product_id}", response_model=dict)
async def delete_product(product_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.get("/products/top-sellers/{branch_id}", response_model=List[dict])
async def get_top_sellers(branch_id: str, limit: int = 10, current_user: dict = Depends(get_current_user)):
    products = await db.products.find(
        {"branch_id": branch_id, "is_active": True},
        {"_id": 0}
    ).sort("total_sold", -1).limit(limit).to_list(limit)
    return products

# ==================== TABLE ROUTES ====================

@api_router.post("/tables", response_model=dict)
async def create_table(table: TableCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    table_dict = table.model_dump()
    table_dict["id"] = str(uuid.uuid4())
    await db.tables.insert_one(table_dict)
    del table_dict["_id"] if "_id" in table_dict else None
    return table_dict

@api_router.get("/tables", response_model=List[dict])
async def get_tables(branch_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if branch_id:
        query["branch_id"] = branch_id
    tables = await db.tables.find(query, {"_id": 0}).sort("number", 1).to_list(100)
    return tables

@api_router.put("/tables/{table_id}", response_model=dict)
async def update_table(table_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    result = await db.tables.update_one({"id": table_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"message": "Table updated successfully"}

@api_router.delete("/tables/{table_id}", response_model=dict)
async def delete_table(table_id: str, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    result = await db.tables.delete_one({"id": table_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"message": "Table deleted successfully"}

# ==================== ORDER ROUTES ====================

async def get_next_order_number(branch_id: str) -> int:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = await db.orders.count_documents({
        "branch_id": branch_id,
        "created_at": {"$gte": today.isoformat()}
    })
    return count + 1

@api_router.post("/orders", response_model=dict)
async def create_order(order: OrderCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.CASHIER]))):
    order_dict = order.model_dump()
    order_dict["id"] = str(uuid.uuid4())
    order_dict["order_number"] = await get_next_order_number(order.branch_id)
    order_dict["status"] = OrderStatus.PENDING.value
    order_dict["cashier_id"] = current_user["user_id"]
    order_dict["cashier_name"] = current_user.get("email", "")
    order_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    order_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update table status if dine-in
    if order.table_id:
        await db.tables.update_one(
            {"id": order.table_id},
            {"$set": {"is_occupied": True, "current_order_id": order_dict["id"]}}
        )
    
    await db.orders.insert_one(order_dict)
    del order_dict["_id"] if "_id" in order_dict else None
    
    # Broadcast to kitchen
    await manager.broadcast_to_branch(order.branch_id, {
        "type": "new_order",
        "order": order_dict
    })
    
    return order_dict

@api_router.get("/orders", response_model=List[dict])
async def get_orders(
    branch_id: Optional[str] = None,
    status: Optional[str] = None,
    is_paid: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if branch_id:
        query["branch_id"] = branch_id
    if status:
        query["status"] = status
    if is_paid is not None:
        query["is_paid"] = is_paid
    if date_from:
        query["created_at"] = {"$gte": date_from}
    if date_to:
        if "created_at" in query:
            query["created_at"]["$lte"] = date_to
        else:
            query["created_at"] = {"$lte": date_to}
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/orders/{order_id}", response_model=dict)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/orders/{order_id}", response_model=dict)
async def update_order(order_id: str, update_data: dict, current_user: dict = Depends(get_current_user)):
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get updated order and broadcast
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if order:
        await manager.broadcast_to_branch(order["branch_id"], {
            "type": "order_updated",
            "order": order
        })
    
    return {"message": "Order updated successfully"}

@api_router.put("/orders/{order_id}/status", response_model=dict)
async def update_order_status(order_id: str, status: str, current_user: dict = Depends(get_current_user)):
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status == OrderStatus.DELIVERED.value:
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get updated order and broadcast
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if order:
        await manager.broadcast_to_branch(order["branch_id"], {
            "type": "order_status_changed",
            "order": order
        })
    
    return {"message": "Order status updated successfully"}

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments", response_model=dict)
async def process_payment(payment: PaymentCreate, current_user: dict = Depends(require_roles([UserRole.ADMIN, UserRole.CASHIER]))):
    order = await db.orders.find_one({"id": payment.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("is_paid"):
        raise HTTPException(status_code=400, detail="Order already paid")
    
    payment_details = {
        "method": payment.payment_method.value,
        "cash_amount": payment.cash_amount,
        "card_amount": payment.card_amount,
        "change_amount": payment.change_amount,
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "processed_by": current_user["user_id"]
    }
    
    update_data = {
        "is_paid": True,
        "payment_method": payment.payment_method.value,
        "payment_details": payment_details,
        "status": OrderStatus.DELIVERED.value,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one({"id": payment.order_id}, {"$set": update_data})
    
    # Update product sales count
    for item in order.get("items", []):
        await db.products.update_one(
            {"id": item["product_id"]},
            {"$inc": {"total_sold": item["quantity"]}}
        )
    
    # Free up table if dine-in
    if order.get("table_id"):
        await db.tables.update_one(
            {"id": order["table_id"]},
            {"$set": {"is_occupied": False, "current_order_id": None}}
        )
    
    # Broadcast payment completion
    await manager.broadcast_to_branch(order["branch_id"], {
        "type": "order_paid",
        "order_id": payment.order_id
    })
    
    return {"message": "Payment processed successfully", "payment_details": payment_details}

# ==================== REPORTS ROUTES ====================

@api_router.get("/reports/daily/{branch_id}", response_model=dict)
async def get_daily_report(branch_id: str, date: Optional[str] = None, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    if date:
        report_date = datetime.fromisoformat(date)
    else:
        report_date = datetime.now(timezone.utc)
    
    start_of_day = report_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    orders = await db.orders.find({
        "branch_id": branch_id,
        "is_paid": True,
        "created_at": {
            "$gte": start_of_day.isoformat(),
            "$lt": end_of_day.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(o.get("total", 0) for o in orders)
    total_tax = sum(o.get("tax_amount", 0) for o in orders)
    cash_total = sum(o.get("total", 0) for o in orders if o.get("payment_method") == "cash")
    card_total = sum(o.get("total", 0) for o in orders if o.get("payment_method") == "card")
    
    return {
        "date": start_of_day.isoformat(),
        "branch_id": branch_id,
        "total_orders": len(orders),
        "total_revenue": total_revenue,
        "total_tax": total_tax,
        "cash_total": cash_total,
        "card_total": card_total,
        "orders": orders
    }

@api_router.get("/reports/summary/{branch_id}", response_model=dict)
async def get_summary_report(
    branch_id: str,
    period: str = "daily",
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    now = datetime.now(timezone.utc)
    
    if period == "daily":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        start_date = now - timedelta(days=7)
    elif period == "monthly":
        start_date = now - timedelta(days=30)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    orders = await db.orders.find({
        "branch_id": branch_id,
        "is_paid": True,
        "created_at": {"$gte": start_date.isoformat()}
    }, {"_id": 0}).to_list(10000)
    
    total_revenue = sum(o.get("total", 0) for o in orders)
    total_tax = sum(o.get("tax_amount", 0) for o in orders)
    cash_total = sum(o.get("total", 0) for o in orders if o.get("payment_method") == "cash")
    card_total = sum(o.get("total", 0) for o in orders if o.get("payment_method") == "card")
    
    # Top sellers
    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            pid = item["product_id"]
            if pid not in product_sales:
                product_sales[pid] = {
                    "product_id": pid,
                    "product_name": item["product_name"],
                    "quantity": 0,
                    "revenue": 0
                }
            product_sales[pid]["quantity"] += item["quantity"]
            product_sales[pid]["revenue"] += item["total_price"]
    
    top_products = sorted(product_sales.values(), key=lambda x: x["quantity"], reverse=True)[:10]
    
    return {
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": now.isoformat(),
        "branch_id": branch_id,
        "total_orders": len(orders),
        "total_revenue": total_revenue,
        "total_tax": total_tax,
        "cash_total": cash_total,
        "card_total": card_total,
        "top_products": top_products
    }

@api_router.get("/reports/staff/{branch_id}", response_model=List[dict])
async def get_staff_report(
    branch_id: str,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    query = {"branch_id": branch_id, "is_paid": True}
    
    if date_from:
        query["created_at"] = {"$gte": date_from}
    if date_to:
        if "created_at" in query:
            query["created_at"]["$lte"] = date_to
        else:
            query["created_at"] = {"$lte": date_to}
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(10000)
    
    staff_sales = {}
    for order in orders:
        cashier_id = order.get("cashier_id")
        if cashier_id:
            if cashier_id not in staff_sales:
                staff_sales[cashier_id] = {
                    "cashier_id": cashier_id,
                    "cashier_name": order.get("cashier_name", "Unknown"),
                    "total_orders": 0,
                    "total_revenue": 0
                }
            staff_sales[cashier_id]["total_orders"] += 1
            staff_sales[cashier_id]["total_revenue"] += order.get("total", 0)
    
    return list(staff_sales.values())

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings", response_model=dict)
async def get_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"id": "global_settings"}, {"_id": 0})
    if not settings:
        default_settings = BusinessSettings().model_dump()
        await db.settings.insert_one(default_settings)
        return default_settings
    return settings

@api_router.put("/settings", response_model=dict)
async def update_settings(settings: dict, current_user: dict = Depends(require_roles([UserRole.ADMIN]))):
    settings["id"] = "global_settings"
    await db.settings.update_one(
        {"id": "global_settings"},
        {"$set": settings},
        upsert=True
    )
    return {"message": "Settings updated successfully"}

# ==================== QR MENU ROUTES (PUBLIC) ====================

@api_router.get("/qr/menu/{branch_id}", response_model=dict)
async def get_qr_menu(branch_id: str):
    branch = await db.branches.find_one({"id": branch_id, "is_active": True}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    categories = await db.categories.find(
        {"branch_id": branch_id, "is_active": True},
        {"_id": 0}
    ).sort("sort_order", 1).to_list(100)
    
    products = await db.products.find(
        {"branch_id": branch_id, "is_active": True},
        {"_id": 0}
    ).to_list(1000)
    
    settings = await db.settings.find_one({"id": "global_settings"}, {"_id": 0})
    
    return {
        "branch": branch,
        "categories": categories,
        "products": products,
        "settings": settings or BusinessSettings().model_dump()
    }

@api_router.get("/qr/table/{table_id}", response_model=dict)
async def get_table_info(table_id: str):
    table = await db.tables.find_one({"id": table_id, "is_active": True}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table

@api_router.post("/qr/order", response_model=dict)
async def create_qr_order(qr_order: QROrderCreate):
    # Get branch tax rate
    branch = await db.branches.find_one({"id": qr_order.branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Get table info
    table = await db.tables.find_one({"id": qr_order.table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Calculate totals
    subtotal = sum(item.total_price for item in qr_order.items)
    tax_rate = branch.get("tax_rate", 18.0)
    tax_amount = subtotal * (tax_rate / 100)
    total = subtotal + tax_amount
    
    order_dict = {
        "id": str(uuid.uuid4()),
        "branch_id": qr_order.branch_id,
        "table_id": qr_order.table_id,
        "table_number": table["number"],
        "order_type": OrderType.DINE_IN.value,
        "items": [item.model_dump() for item in qr_order.items],
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "total": total,
        "notes": qr_order.customer_notes,
        "order_number": await get_next_order_number(qr_order.branch_id),
        "status": OrderStatus.PENDING.value,
        "is_paid": False,
        "is_qr_order": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update table status
    await db.tables.update_one(
        {"id": qr_order.table_id},
        {"$set": {"is_occupied": True, "current_order_id": order_dict["id"]}}
    )
    
    await db.orders.insert_one(order_dict)
    del order_dict["_id"] if "_id" in order_dict else None
    
    # Broadcast to kitchen
    await manager.broadcast_to_branch(qr_order.branch_id, {
        "type": "new_order",
        "order": order_dict
    })
    
    return order_dict

# ==================== WEBSOCKET ROUTES ====================

@app.websocket("/ws/kitchen/{branch_id}")
async def websocket_kitchen(websocket: WebSocket, branch_id: str):
    await manager.connect(websocket, branch_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle any incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket, branch_id)

# ==================== INIT DATA ROUTE ====================

@api_router.post("/init-demo-data", response_model=dict)
async def init_demo_data():
    """Initialize demo data for testing"""
    
    # Check if demo data already exists
    existing_branch = await db.branches.find_one({"name": "Demo Şube"}, {"_id": 0})
    if existing_branch:
        return {"message": "Demo data already exists", "branch_id": existing_branch["id"]}
    
    # Create demo branch
    branch_id = str(uuid.uuid4())
    branch = {
        "id": branch_id,
        "name": "Demo Şube",
        "address": "İstanbul, Türkiye",
        "phone": "+90 212 555 1234",
        "tax_rate": 18.0,
        "currency": "TRY",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.branches.insert_one(branch)
    
    # Create demo admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "admin@lumina.com",
        "name": "Admin User",
        "password": hash_password("admin123"),
        "role": UserRole.ADMIN.value,
        "branch_id": branch_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    
    # Create demo cashier
    cashier_user = {
        "id": str(uuid.uuid4()),
        "email": "kasiyer@lumina.com",
        "name": "Kasiyer",
        "password": hash_password("kasiyer123"),
        "role": UserRole.CASHIER.value,
        "branch_id": branch_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(cashier_user)
    
    # Create demo kitchen user
    kitchen_user = {
        "id": str(uuid.uuid4()),
        "email": "mutfak@lumina.com",
        "name": "Mutfak",
        "password": hash_password("mutfak123"),
        "role": UserRole.KITCHEN.value,
        "branch_id": branch_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(kitchen_user)
    
    # Create categories
    categories = [
        {"name": "Burgerler", "name_en": "Burgers", "sort_order": 1, "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"},
        {"name": "Pizzalar", "name_en": "Pizzas", "sort_order": 2, "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"},
        {"name": "Makarnalar", "name_en": "Pasta", "sort_order": 3, "image_url": "https://images.pexels.com/photos/262961/pexels-photo-262961.jpeg?w=400"},
        {"name": "İçecekler", "name_en": "Beverages", "sort_order": 4, "image_url": "https://images.pexels.com/photos/531761/pexels-photo-531761.jpeg?w=400"},
        {"name": "Tatlılar", "name_en": "Desserts", "sort_order": 5, "image_url": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400"}
    ]
    
    category_ids = {}
    for cat in categories:
        cat_id = str(uuid.uuid4())
        category_ids[cat["name"]] = cat_id
        await db.categories.insert_one({
            "id": cat_id,
            "name": cat["name"],
            "name_en": cat["name_en"],
            "branch_id": branch_id,
            "sort_order": cat["sort_order"],
            "image_url": cat["image_url"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create products
    products = [
        # Burgers
        {"name": "Klasik Burger", "name_en": "Classic Burger", "price": 89.90, "category": "Burgerler", "description": "180gr dana eti, marul, domates, turşu"},
        {"name": "Cheese Burger", "name_en": "Cheese Burger", "price": 99.90, "category": "Burgerler", "description": "180gr dana eti, cheddar peyniri, marul, domates"},
        {"name": "Double Burger", "name_en": "Double Burger", "price": 139.90, "category": "Burgerler", "description": "2x180gr dana eti, cheddar, bacon"},
        {"name": "Tavuk Burger", "name_en": "Chicken Burger", "price": 79.90, "category": "Burgerler", "description": "Izgara tavuk göğsü, marul, özel sos"},
        # Pizzas
        {"name": "Margarita", "name_en": "Margherita", "price": 119.90, "category": "Pizzalar", "description": "Domates sosu, mozzarella, fesleğen"},
        {"name": "Karışık Pizza", "name_en": "Mixed Pizza", "price": 159.90, "category": "Pizzalar", "description": "Sucuk, sosis, mantar, biber, zeytin"},
        {"name": "Pepperoni", "name_en": "Pepperoni", "price": 139.90, "category": "Pizzalar", "description": "Pepperoni, mozzarella, domates sosu"},
        # Pasta
        {"name": "Spaghetti Bolonez", "name_en": "Spaghetti Bolognese", "price": 89.90, "category": "Makarnalar", "description": "Kıymalı domates soslu spagetti"},
        {"name": "Fettuccine Alfredo", "name_en": "Fettuccine Alfredo", "price": 99.90, "category": "Makarnalar", "description": "Kremalı sos, parmesan"},
        {"name": "Penne Arrabbiata", "name_en": "Penne Arrabbiata", "price": 84.90, "category": "Makarnalar", "description": "Acı biberli domates sos"},
        # Beverages
        {"name": "Kola", "name_en": "Cola", "price": 25.00, "category": "İçecekler", "description": "330ml"},
        {"name": "Ayran", "name_en": "Ayran", "price": 15.00, "category": "İçecekler", "description": "300ml"},
        {"name": "Limonata", "name_en": "Lemonade", "price": 30.00, "category": "İçecekler", "description": "Taze sıkılmış"},
        {"name": "Türk Kahvesi", "name_en": "Turkish Coffee", "price": 35.00, "category": "İçecekler", "description": "Geleneksel"},
        # Desserts
        {"name": "Cheesecake", "name_en": "Cheesecake", "price": 65.00, "category": "Tatlılar", "description": "New York usulü"},
        {"name": "Tiramisu", "name_en": "Tiramisu", "price": 70.00, "category": "Tatlılar", "description": "İtalyan klasiği"},
        {"name": "Sütlaç", "name_en": "Rice Pudding", "price": 45.00, "category": "Tatlılar", "description": "Fırında pişirilmiş"}
    ]
    
    for prod in products:
        await db.products.insert_one({
            "id": str(uuid.uuid4()),
            "name": prod["name"],
            "name_en": prod["name_en"],
            "price": prod["price"],
            "description": prod["description"],
            "description_en": prod.get("description", ""),
            "category_id": category_ids[prod["category"]],
            "branch_id": branch_id,
            "is_active": True,
            "total_sold": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create tables
    for i in range(1, 13):
        await db.tables.insert_one({
            "id": str(uuid.uuid4()),
            "number": i,
            "name": f"Masa {i}",
            "capacity": 4 if i <= 8 else 6,
            "branch_id": branch_id,
            "is_occupied": False,
            "is_active": True
        })
    
    # Create default settings
    settings = {
        "id": "global_settings",
        "business_name": "Lumina Restaurant",
        "business_address": "İstanbul, Türkiye",
        "business_phone": "+90 212 555 1234",
        "business_email": "info@lumina.com",
        "tax_number": "1234567890",
        "default_tax_rate": 18.0,
        "currency": "TRY",
        "default_language": "tr",
        "receipt_footer": "Teşekkür ederiz! Afiyet olsun!"
    }
    await db.settings.update_one({"id": "global_settings"}, {"$set": settings}, upsert=True)
    
    return {
        "message": "Demo data initialized successfully",
        "branch_id": branch_id,
        "credentials": {
            "admin": {"email": "admin@lumina.com", "password": "admin123"},
            "cashier": {"email": "kasiyer@lumina.com", "password": "kasiyer123"},
            "kitchen": {"email": "mutfak@lumina.com", "password": "mutfak123"}
        }
    }

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "Lumina POS API v1.0.0", "status": "running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
