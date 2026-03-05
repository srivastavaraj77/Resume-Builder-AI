# Resume API Contract (Hardened)

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

## 1) List my resumes
`GET /api/resumes`
Header: `Authorization: Bearer <token>`

## 2) Create resume
`POST /api/resumes`
Header: `Authorization: Bearer <token>`

### Request body
```json
{
  "title": "Backend Engineer Resume"
}
```

## 3) Get resume by id
`GET /api/resumes/:resumeId`
Header: `Authorization: Bearer <token>`

## 4) Update resume
`PUT /api/resumes/:resumeId`
Header: `Authorization: Bearer <token>`

### Allowed fields
`title`, `template`, `accent_color`, `professional_summary`, `personal_info`, `experience`, `education`, `project`, `skills`, `public`

## 5) Update visibility
`PATCH /api/resumes/:resumeId/visibility`
Header: `Authorization: Bearer <token>`

### Request body
```json
{
  "isPublic": true
}
```

## 6) Delete resume
`DELETE /api/resumes/:resumeId`
Header: `Authorization: Bearer <token>`

## 7) Public resume by id
`GET /api/resumes/public/:resumeId`
No auth required.

## Common validation
1. `resumeId` must be a valid Mongo ObjectId.
2. Invalid payloads return `VALIDATION_ERROR`.
3. Missing resumes return `RESUME_NOT_FOUND`.
