# Auth API Contract (Hardened)

## Base response format

### Success
```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human readable message",
    "details": null
  }
}
```

## Endpoints

## 1) Register
`POST /api/users/register`

### Request body
```json
{
  "name": "Raj",
  "email": "raj@example.com",
  "password": "password123"
}
```

### Validation rules
1. `name` required
2. `email` required and must include `@`
3. `password` required and min length 8

### Success response (201)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "jwt-token",
    "user": {
      "_id": "user-id",
      "name": "Raj",
      "email": "raj@example.com"
    }
  }
}
```

## 2) Login
`POST /api/users/login`

### Request body
```json
{
  "email": "raj@example.com",
  "password": "password123"
}
```

### Validation rules
1. `email` required and must include `@`
2. `password` required

### Success response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "_id": "user-id",
      "name": "Raj",
      "email": "raj@example.com"
    }
  }
}
```

## 3) Get Current User
`GET /api/users/data`

### Required header
`Authorization: Bearer <token>`

### Success response (200)
```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "user": {
      "_id": "user-id",
      "name": "Raj",
      "email": "raj@example.com"
    }
  }
}
```
