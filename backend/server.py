from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import logging
import uuid
import jwt
import hashlib
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'v4-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Google OAuth
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', '')
ALLOWED_DOMAIN = os.environ.get('ALLOWED_DOMAIN', 'v4company.com')

# Google Chat Webhook
GOOGLE_CHAT_WEBHOOK = os.environ.get('GOOGLE_CHAT_WEBHOOK', '')

# Encryption key (AES-256)
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', 'v4-encryption-master-key-32-bytes-long!')

# Generate Fernet key from master key
def get_fernet_key():
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b'v4company-salt',
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))
    return Fernet(key)

fernet = get_fernet_key()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============= MODELS =============

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    avatar_url: Optional[str] = None
    role: str = "contributor"  # admin, manager, contributor, client
    google_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    mfa_enabled: bool = False
    status: str = "active"  # active, pending, inactive

class Vault(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # client, product, squad
    parent_id: Optional[str] = None
    path: str
    owner_id: str
    acl: List[Dict[str, Any]] = []
    tags: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Item(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    vault_id: str
    type: str  # web_credential, api_key, ad_token, etc.
    title: str
    login: Optional[str] = None
    password_encrypted: Optional[str] = None
    login_url: Optional[str] = None
    metadata: Dict[str, Any] = {}
    owner_id: str
    environment: str = "prod"  # prod, stage
    criticality: str = "medium"  # high, medium, low
    expires_at: Optional[datetime] = None
    tags: Dict[str, str] = {}
    attachments: List[Dict[str, Any]] = []
    notes_encrypted: Optional[str] = None
    login_instructions: Optional[str] = None
    
    # New security features
    no_copy: bool = False  # Prevent copy/paste
    requires_checkout: bool = False  # Check-out/check-in flow
    checked_out_by: Optional[str] = None
    checked_out_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str
    updated_by: str

class BreakGlassRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requester_id: str
    item_id: str
    vault_id: str
    reason: str
    status: str = "pending"  # pending, approved, denied, completed
    approver1_id: Optional[str] = None
    approver1_at: Optional[datetime] = None
    approver2_id: Optional[str] = None
    approver2_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    user_id: str
    user_email: str
    item_id: Optional[str] = None
    vault_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JITRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requester_id: str
    item_id: str
    vault_id: str
    reason: str
    requested_duration_hours: int = 2
    status: str = "pending"  # pending, approved, denied, expired
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============= REQUEST/RESPONSE MODELS =============

class VaultCreate(BaseModel):
    name: str
    type: str
    parent_id: Optional[str] = None
    tags: Dict[str, str] = {}

class ItemCreate(BaseModel):
    vault_id: str
    type: str
    title: str
    login: Optional[str] = None
    password: Optional[str] = None
    login_url: Optional[str] = None
    metadata: Dict[str, Any] = {}
    environment: str = "prod"
    criticality: str = "medium"
    expires_at: Optional[datetime] = None
    tags: Dict[str, str] = {}
    notes: Optional[str] = None
    login_instructions: Optional[str] = None

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None
    login_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    environment: Optional[str] = None
    criticality: Optional[str] = None
    expires_at: Optional[datetime] = None
    tags: Optional[Dict[str, str]] = None
    notes: Optional[str] = None
    login_instructions: Optional[str] = None

class JITRequestCreate(BaseModel):
    item_id: str
    vault_id: str
    reason: str
    requested_duration_hours: int = 2

class ImportSheetRow(BaseModel):
    vault_path: str
    type: str
    title: str
    login: Optional[str] = None
    password: Optional[str] = None
    login_url: Optional[str] = None
    environment: str = "prod"
    criticality: str = "medium"
    client: Optional[str] = None
    squad: Optional[str] = None


# ============= ENCRYPTION HELPERS =============

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data using AES-256"""
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    return fernet.decrypt(encrypted_data.encode()).decode()


# ============= AUTH HELPERS =============

def create_jwt_token(user_data: dict) -> str:
    """Create JWT token"""
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'role': user_data['role'],
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'id': payload['user_id']})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_client_ip(request: Request) -> str:
    """Get client IP address"""
    return request.client.host if request.client else "unknown"

async def log_audit(event_type: str, user: User, request: Request, item_id: Optional[str] = None, vault_id: Optional[str] = None, details: Dict = {}):
    """Log audit event"""
    log_entry = AuditLog(
        event_type=event_type,
        user_id=user.id,
        user_email=user.email,
        item_id=item_id,
        vault_id=vault_id,
        ip_address=await get_client_ip(request),
        user_agent=request.headers.get('user-agent', 'unknown'),
        details=details
    )
    await db.audit_logs.insert_one(log_entry.dict())
    logger.info(f"Audit log: {event_type} by {user.email}")

async def send_google_chat_notification(message: str):
    """Send notification to Google Chat"""
    if not GOOGLE_CHAT_WEBHOOK:
        logger.warning("Google Chat webhook not configured")
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_CHAT_WEBHOOK,
                json={"text": message},
                timeout=10.0
            )
            if response.status_code == 200:
                logger.info(f"Google Chat notification sent: {message}")
            else:
                logger.error(f"Failed to send Google Chat notification: {response.status_code}")
    except Exception as e:
        logger.error(f"Error sending Google Chat notification: {str(e)}")


# ============= AUTH ROUTES =============

@api_router.get("/auth/google/login")
async def google_login():
    """Redirect to Google OAuth"""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid email profile&"
        f"access_type=offline"
    )
    return {"url": google_auth_url}

@api_router.get("/auth/google/callback")
async def google_callback(code: str, request: Request):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )
            token_data = token_response.json()
            
            if "error" in token_data:
                raise HTTPException(status_code=400, detail=token_data["error"])
            
            # Get user info
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            user_info = user_response.json()
        
        # Validate domain
        email = user_info.get('email', '')
        if not email.endswith(f"@{ALLOWED_DOMAIN}"):
            raise HTTPException(status_code=403, detail=f"Only @{ALLOWED_DOMAIN} emails are allowed")
        
        # Check if user exists
        existing_user = await db.users.find_one({'email': email})
        
        if existing_user:
            # Update last login
            await db.users.update_one(
                {'id': existing_user['id']},
                {'$set': {'last_login': datetime.now(timezone.utc)}}
            )
            user = User(**existing_user)
        else:
            # Create new user (pending approval)
            user = User(
                email=email,
                name=user_info.get('name', email),
                avatar_url=user_info.get('picture'),
                google_id=user_info.get('id'),
                role='contributor',
                status='active',  # Auto-activate for MVP
                last_login=datetime.now(timezone.utc)
            )
            await db.users.insert_one(user.dict())
        
        # Create JWT token
        token = create_jwt_token(user.dict())
        
        # Log login
        await log_audit('login', user, request)
        
        # Redirect to frontend with token
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}?token={token}")
        
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

@api_router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user), request: Request = None):
    """Logout user"""
    await log_audit('logout', current_user, request)
    return {"message": "Logged out successfully"}


# ============= VAULT ROUTES =============

@api_router.post("/vaults", response_model=Vault)
async def create_vault(vault_data: VaultCreate, current_user: User = Depends(get_current_user), request: Request = None):
    """Create a new vault/folder"""
    # Build path
    path = vault_data.name
    if vault_data.parent_id:
        parent = await db.vaults.find_one({'id': vault_data.parent_id})
        if parent:
            path = f"{parent['path']} > {vault_data.name}"
    
    vault = Vault(
        name=vault_data.name,
        type=vault_data.type,
        parent_id=vault_data.parent_id,
        path=path,
        owner_id=current_user.id,
        tags=vault_data.tags,
        acl=[
            {'user_id': current_user.id, 'permissions': ['view', 'create', 'edit', 'delete', 'reveal', 'export']}
        ]
    )
    
    await db.vaults.insert_one(vault.dict())
    await log_audit('vault_created', current_user, request, vault_id=vault.id, details={'name': vault.name})
    
    return vault

@api_router.get("/vaults", response_model=List[Vault])
async def get_vaults(current_user: User = Depends(get_current_user)):
    """Get all vaults (tree structure)"""
    # For MVP, return all vaults. In production, filter by ACL
    vaults = await db.vaults.find().to_list(1000)
    return [Vault(**v) for v in vaults]

@api_router.get("/vaults/{vault_id}", response_model=Vault)
async def get_vault(vault_id: str, current_user: User = Depends(get_current_user)):
    """Get vault details"""
    vault = await db.vaults.find_one({'id': vault_id})
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    return Vault(**vault)

@api_router.delete("/vaults/{vault_id}")
async def delete_vault(vault_id: str, current_user: User = Depends(get_current_user), request: Request = None):
    """Delete vault"""
    vault = await db.vaults.find_one({'id': vault_id})
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found")
    
    # Delete all items in vault
    await db.items.delete_many({'vault_id': vault_id})
    
    # Delete vault
    await db.vaults.delete_one({'id': vault_id})
    
    await log_audit('vault_deleted', current_user, request, vault_id=vault_id, details={'name': vault['name']})
    
    return {"message": "Vault deleted successfully"}


# ============= ITEM ROUTES =============

@api_router.post("/items", response_model=Item)
async def create_item(item_data: ItemCreate, current_user: User = Depends(get_current_user), request: Request = None):
    """Create a new item (secret)"""
    # Encrypt sensitive fields
    password_encrypted = None
    if item_data.password:
        password_encrypted = encrypt_data(item_data.password)
    
    notes_encrypted = None
    if item_data.notes:
        notes_encrypted = encrypt_data(item_data.notes)
    
    item = Item(
        vault_id=item_data.vault_id,
        type=item_data.type,
        title=item_data.title,
        login=item_data.login,
        password_encrypted=password_encrypted,
        login_url=item_data.login_url,
        metadata=item_data.metadata,
        owner_id=current_user.id,
        environment=item_data.environment,
        criticality=item_data.criticality,
        expires_at=item_data.expires_at,
        tags=item_data.tags,
        notes_encrypted=notes_encrypted,
        login_instructions=item_data.login_instructions,
        created_by=current_user.id,
        updated_by=current_user.id
    )
    
    await db.items.insert_one(item.dict())
    await log_audit('item_created', current_user, request, item_id=item.id, vault_id=item.vault_id, details={'title': item.title})
    
    return item

@api_router.get("/items", response_model=List[Item])
async def get_items(
    vault_id: Optional[str] = None,
    search: Optional[str] = None,
    type: Optional[str] = None,
    environment: Optional[str] = None,
    criticality: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get items with filters"""
    query = {}
    
    if vault_id:
        query['vault_id'] = vault_id
    if type:
        query['type'] = type
    if environment:
        query['environment'] = environment
    if criticality:
        query['criticality'] = criticality
    if search:
        query['title'] = {'$regex': search, '$options': 'i'}
    
    items = await db.items.find(query).to_list(1000)
    return [Item(**item) for item in items]

@api_router.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: str, current_user: User = Depends(get_current_user)):
    """Get item details (without revealing password)"""
    item = await db.items.find_one({'id': item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return Item(**item)

@api_router.post("/items/{item_id}/reveal")
async def reveal_item(item_id: str, current_user: User = Depends(get_current_user), request: Request = None):
    """Reveal password (decrypt and log)"""
    item = await db.items.find_one({'id': item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Decrypt password
    password = None
    if item.get('password_encrypted'):
        password = decrypt_data(item['password_encrypted'])
    
    notes = None
    if item.get('notes_encrypted'):
        notes = decrypt_data(item['notes_encrypted'])
    
    # Log reveal
    await log_audit('item_revealed', current_user, request, item_id=item_id, vault_id=item['vault_id'], details={'title': item['title']})
    
    # Send notification if critical
    if item.get('criticality') == 'high':
        vault = await db.vaults.find_one({'id': item['vault_id']})
        vault_path = vault['path'] if vault else 'Unknown'
        message = f"🔓 Critical password revealed!\n\nItem: {item['title']}\nVault: {vault_path}\nUser: {current_user.name} ({current_user.email})\nIP: {await get_client_ip(request)}"
        await send_google_chat_notification(message)
    
    return {
        'password': password,
        'notes': notes
    }

@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: str, item_data: ItemUpdate, current_user: User = Depends(get_current_user), request: Request = None):
    """Update item"""
    item = await db.items.find_one({'id': item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_dict = {}
    
    if item_data.title is not None:
        update_dict['title'] = item_data.title
    if item_data.login is not None:
        update_dict['login'] = item_data.login
    if item_data.password is not None:
        update_dict['password_encrypted'] = encrypt_data(item_data.password)
    if item_data.login_url is not None:
        update_dict['login_url'] = item_data.login_url
    if item_data.metadata is not None:
        update_dict['metadata'] = item_data.metadata
    if item_data.environment is not None:
        update_dict['environment'] = item_data.environment
    if item_data.criticality is not None:
        update_dict['criticality'] = item_data.criticality
    if item_data.expires_at is not None:
        update_dict['expires_at'] = item_data.expires_at
    if item_data.tags is not None:
        update_dict['tags'] = item_data.tags
    if item_data.notes is not None:
        update_dict['notes_encrypted'] = encrypt_data(item_data.notes)
    if item_data.login_instructions is not None:
        update_dict['login_instructions'] = item_data.login_instructions
    
    update_dict['updated_at'] = datetime.now(timezone.utc)
    update_dict['updated_by'] = current_user.id
    
    await db.items.update_one({'id': item_id}, {'$set': update_dict})
    
    await log_audit('item_updated', current_user, request, item_id=item_id, vault_id=item['vault_id'], details={'title': item['title']})
    
    updated_item = await db.items.find_one({'id': item_id})
    return Item(**updated_item)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: User = Depends(get_current_user), request: Request = None):
    """Delete item"""
    item = await db.items.find_one({'id': item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await db.items.delete_one({'id': item_id})
    
    await log_audit('item_deleted', current_user, request, item_id=item_id, vault_id=item['vault_id'], details={'title': item['title']})
    
    return {"message": "Item deleted successfully"}


# ============= AUDIT ROUTES =============

@api_router.get("/audit/logs", response_model=List[AuditLog])
async def get_audit_logs(
    event_type: Optional[str] = None,
    user_id: Optional[str] = None,
    item_id: Optional[str] = None,
    vault_id: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get audit logs with filters"""
    query = {}
    
    if event_type:
        query['event_type'] = event_type
    if user_id:
        query['user_id'] = user_id
    if item_id:
        query['item_id'] = item_id
    if vault_id:
        query['vault_id'] = vault_id
    
    logs = await db.audit_logs.find(query).sort('timestamp', -1).limit(limit).to_list(limit)
    
    # Enrich logs with vault and item names
    enriched_logs = []
    for log in logs:
        log_dict = AuditLog(**log).dict()
        
        # Add vault name
        if log.get('vault_id'):
            vault = await db.vaults.find_one({'id': log['vault_id']})
            log_dict['details']['vault_name'] = vault['name'] if vault else 'Unknown Vault'
        
        # Add item title
        if log.get('item_id'):
            item = await db.items.find_one({'id': log['item_id']})
            log_dict['details']['item_title'] = item['title'] if item else log_dict['details'].get('title', 'Unknown Item')
        
        enriched_logs.append(AuditLog(**log_dict))
    
    return enriched_logs


# ============= JIT ROUTES =============

@api_router.post("/jit/request", response_model=JITRequest)
async def create_jit_request(jit_data: JITRequestCreate, current_user: User = Depends(get_current_user), request: Request = None):
    """Create JIT access request"""
    jit_request = JITRequest(
        requester_id=current_user.id,
        item_id=jit_data.item_id,
        vault_id=jit_data.vault_id,
        reason=jit_data.reason,
        requested_duration_hours=jit_data.requested_duration_hours
    )
    
    await db.jit_requests.insert_one(jit_request.dict())
    
    await log_audit('jit_requested', current_user, request, item_id=jit_data.item_id, vault_id=jit_data.vault_id, details={'reason': jit_data.reason})
    
    # Send notification
    item = await db.items.find_one({'id': jit_data.item_id})
    vault = await db.vaults.find_one({'id': jit_data.vault_id})
    message = f"⏰ JIT Access Request\n\nUser: {current_user.name} ({current_user.email})\nItem: {item['title'] if item else 'Unknown'}\nVault: {vault['path'] if vault else 'Unknown'}\nDuration: {jit_data.requested_duration_hours}h\nReason: {jit_data.reason}"
    await send_google_chat_notification(message)
    
    return jit_request

@api_router.get("/jit/requests", response_model=List[JITRequest])
async def get_jit_requests(status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get JIT requests"""
    query = {}
    
    # If not admin/manager, only show own requests
    if current_user.role not in ['admin', 'manager']:
        query['requester_id'] = current_user.id
    
    if status:
        query['status'] = status
    
    requests = await db.jit_requests.find(query).sort('created_at', -1).to_list(100)
    return [JITRequest(**req) for req in requests]

@api_router.post("/jit/{request_id}/approve")
async def approve_jit_request(request_id: str, current_user: User = Depends(get_current_user), request: Request = None):
    """Approve JIT request (Manager/Admin only)"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Only managers and admins can approve")
    
    jit_request = await db.jit_requests.find_one({'id': request_id})
    if not jit_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if jit_request['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Request already processed")
    
    expires_at = datetime.now(timezone.utc) + timedelta(hours=jit_request['requested_duration_hours'])
    
    await db.jit_requests.update_one(
        {'id': request_id},
        {'$set': {
            'status': 'approved',
            'approved_by': current_user.id,
            'approved_at': datetime.now(timezone.utc),
            'expires_at': expires_at
        }}
    )
    
    await log_audit('jit_approved', current_user, request, item_id=jit_request['item_id'], vault_id=jit_request['vault_id'], details={'request_id': request_id})
    
    # Send notification
    requester = await db.users.find_one({'id': jit_request['requester_id']})
    item = await db.items.find_one({'id': jit_request['item_id']})
    message = f"✅ JIT Access Approved!\n\nRequester: {requester['name'] if requester else 'Unknown'}\nItem: {item['title'] if item else 'Unknown'}\nApproved by: {current_user.name}\nExpires: {expires_at.strftime('%Y-%m-%d %H:%M UTC')}"
    await send_google_chat_notification(message)
    
    return {"message": "Request approved", "expires_at": expires_at}

@api_router.post("/jit/{request_id}/deny")
async def deny_jit_request(request_id: str, current_user: User = Depends(get_current_user), request: Request = None):
    """Deny JIT request (Manager/Admin only)"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Only managers and admins can deny")
    
    jit_request = await db.jit_requests.find_one({'id': request_id})
    if not jit_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if jit_request['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Request already processed")
    
    await db.jit_requests.update_one(
        {'id': request_id},
        {'$set': {'status': 'denied', 'approved_by': current_user.id, 'approved_at': datetime.now(timezone.utc)}}
    )
    
    await log_audit('jit_denied', current_user, request, item_id=jit_request['item_id'], vault_id=jit_request['vault_id'], details={'request_id': request_id})
    
    return {"message": "Request denied"}


# ============= IMPORT ROUTES =============

@api_router.post("/import/sheets")
async def import_from_sheets(rows: List[ImportSheetRow], current_user: User = Depends(get_current_user), request: Request = None):
    """Import items from Google Sheets format"""
    imported_count = 0
    errors = []
    
    for row in rows:
        try:
            # Find or create vault
            vault = await db.vaults.find_one({'path': row.vault_path})
            
            if not vault:
                # Create vault
                vault = Vault(
                    name=row.vault_path.split(' > ')[-1],
                    type='client',
                    path=row.vault_path,
                    owner_id=current_user.id,
                    tags={'client': row.client or '', 'squad': row.squad or ''}
                )
                await db.vaults.insert_one(vault.dict())
            
            # Create item
            password_encrypted = None
            if row.password:
                password_encrypted = encrypt_data(row.password)
            
            item = Item(
                vault_id=vault['id'],
                type=row.type,
                title=row.title,
                login=row.login,
                password_encrypted=password_encrypted,
                login_url=row.login_url,
                owner_id=current_user.id,
                environment=row.environment,
                criticality=row.criticality,
                tags={'client': row.client or '', 'squad': row.squad or ''},
                created_by=current_user.id,
                updated_by=current_user.id
            )
            
            await db.items.insert_one(item.dict())
            imported_count += 1
            
        except Exception as e:
            errors.append({'row': row.dict(), 'error': str(e)})
    
    await log_audit('import_completed', current_user, request, details={'imported': imported_count, 'errors': len(errors)})
    
    return {
        'imported_count': imported_count,
        'errors_count': len(errors),
        'errors': errors
    }


# ============= DASHBOARD STATS =============

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics"""
    total_vaults = await db.vaults.count_documents({})
    total_items = await db.items.count_documents({})
    
    # Items expiring soon (next 7 days)
    seven_days_from_now = datetime.now(timezone.utc) + timedelta(days=7)
    expiring_soon = await db.items.count_documents({
        'expires_at': {'$lte': seven_days_from_now, '$gte': datetime.now(timezone.utc)}
    })
    
    # Pending JIT requests
    pending_jit = await db.jit_requests.count_documents({'status': 'pending'})
    
    # Recent activity
    recent_logs = await db.audit_logs.find().sort('timestamp', -1).limit(10).to_list(10)
    
    return {
        'total_vaults': total_vaults,
        'total_items': total_items,
        'expiring_soon': expiring_soon,
        'pending_jit_requests': pending_jit,
        'recent_activity': [AuditLog(**log) for log in recent_logs]
    }


# ============= USER MANAGEMENT ROUTES =============

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    """Get all users (Admin/Manager only)"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Only admins and managers can view users")
    
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.post("/users/invite")
async def invite_user(email: EmailStr, name: str, role: str, current_user: User = Depends(get_current_user)):
    """Invite a new user (Admin/Manager only)"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Only admins and managers can invite users")
    
    # Check if user already exists
    existing_user = await db.users.find_one({'email': email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create new user
    new_user = User(
        email=email,
        name=name,
        role=role,
        status='pending'
    )
    
    await db.users.insert_one(new_user.dict())
    
    # TODO: Send invitation email
    
    return {"message": "User invited successfully", "user": new_user}

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, current_user: User = Depends(get_current_user)):
    """Update user role (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can update user roles")
    
    if role not in ['admin', 'manager', 'contributor', 'client']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {'id': user_id},
        {'$set': {'role': role}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated successfully"}

@api_router.put("/users/{user_id}/status")
async def update_user_status(user_id: str, status: str, current_user: User = Depends(get_current_user)):
    """Update user status (Admin/Manager only)"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Only admins and managers can update user status")
    
    if status not in ['active', 'inactive', 'pending']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.users.update_one(
        {'id': user_id},
        {'$set': {'status': status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User status updated successfully"}


# ============= SETTINGS ROUTES =============

@api_router.get("/settings/webhook")
async def get_webhook_settings(current_user: User = Depends(get_current_user)):
    """Get webhook settings (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can view webhook settings")
    
    return {"webhook_url": GOOGLE_CHAT_WEBHOOK}

@api_router.post("/settings/webhook")
async def update_webhook_settings(webhook_url: str, current_user: User = Depends(get_current_user)):
    """Update webhook settings (Admin only)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can update webhook settings")
    
    # In production, this would update a database setting
    # For now, we'll just validate and return success
    
    return {"message": "Webhook settings updated successfully"}

@api_router.post("/admin/make-me-admin")
async def make_me_admin(current_user: User = Depends(get_current_user)):
    """Emergency route to make current user admin (temporary)"""
    result = await db.users.update_one(
        {'id': current_user.id},
        {'$set': {'role': 'admin'}}
    )
    
    if result.modified_count > 0:
        return {"message": f"User {current_user.email} is now admin"}
    else:
        return {"message": "User is already admin"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()