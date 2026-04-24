# API Documentation

## Auth Routes
### POST /api/auth/register
Creates new user.
Body:
```
{
  "name": "ryan",
  "email": "ryan@test.com",
  "password": "ryanpassword"
}
```
Response:
```
{ "message": "User created" }
```
### POST /api/auth/login
Logs user in and returns JWT.
Body:
```
{
  "email": "ryan@test.com",
  "password": "ryanpassword"
}
```
Response:
```
{
  "token": "jwt_token",
  "user": {
    "id": "...",
    "email": "...",
    "role": "reader"
  }
}
```

### GET /api/auth/me
Returns current user, and requires authentication.

### POST /api/auth/become-author
Upgrades user to author, and requires authentication.

## Book Routes
### POST /api/books
Create a book (authors only). This requires authentication that specifies role must be an author.
Body:
```
{
  "title": "Book",
  "author": "Name",
  "description": "...",
  "published_year": 2024
}
```
Response:
```
{
  "id": "..."
}
```
### GET /api/books/:id
Get book details

### PUT /api/books/:id
Update book (owner only)

### DELETE /api/books/:id
Delete book (owner only)

### GET /api/books/my
Get books created by logged-in author

### GET /api/books/search?q=
Search OpenLibrary, and there's a local db available.

## Reading Status
### POST /api/reading-status
Create or update reading status
```
{
  "book_id": "...",
  "status": "reading"
}
```

### GET /api/reading-status/my
Get current user reading list

### GET /api/reading-status/:bookId
Get status for specific book

### DELETE /api/reading-status/:id
Remove reading status

## Reading Updates
### POST /api/reading-status/:bookId/update
Add progress update, example here:
```
{
  "page_reached": 120,
  "note": "Great chapter"
}
```

### GET /api/reading-status/:bookId/updates
Get updates for a book

## User Routes
### GET /api/users/search?q=
Search users

### GET /api/users/:id
Get public profile

### GET /api/users/:id/profile
Full profile + stats + activity

### GET /api/users/:id/feed
Recent activity feed

### GET /api/users/:id/stats
User stats

### PUT /api/users/:id
Update profile

## Follow System
### POST /api/follows/:id
Follow user

### DELETE /api/follows/:id
Unfollow user

### GET /api/follows/:id/status
Check follow status

### GET /api/follows/following/me
List following

### GET /api/follows/followers/me
List followers

## Search Routes
### GET /api/search?q=
Search OpenLibrary
