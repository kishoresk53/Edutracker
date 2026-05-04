# Security Specification - EduTrack

## Data Invariants
1. Students must be owned by the user who created them.
2. Performance records must be linked to a valid student ID owned by the same user.
3. Insights must be linked to a valid student ID owned by the same user.
4. Timestamps (createdAt, updatedAt) must be server-generated.
5. Marks cannot exceed totalMarks.

## The "Dirty Dozen" Payloads

1. **Identity Theft (Student)**: Try to create a student with someone else's `ownerId`.
2. **Identity Theft (Performance)**: Try to create a performance record with someone else's `ownerId`.
3. **Invalid ID Poisoning**: Create a student with a 2KB studentId string.
4. **Mark Inflation**: Set marks higher than totalMarks.
5. **Unauthorized Multi-Owner Update**: User A tries to edit User B's student record.
6. **Ghost Field Injection**: Add `isAdmin: true` to a performance record update.
7. **Timestamp Spoofing**: Provide a future date for `createdAt`.
8. **Negative Performance**: Set marks to -50.
9. **Orphan Performance**: Create a performance record for a studentId that doesn't exist.
10. **GPA Tampering**: User tries to update an AI-generated insight's analysis directly.
11. **Student Deletion by Non-Owner**: User A tries to delete User B's student.
12. **Blanket Read Scam**: Try to query all students without filtering by `ownerId`.

## The Test Runner (Mock Tests)
- `test('Identity Theft (Student)')`: Rejects if `request.resource.data.ownerId != request.auth.uid`.
- `test('Invalid ID Poisoning')`: Rejects if `id.size() > 128`.
- `test('Mark Inflation')`: Rejects if `marks > totalMarks`.
- `test('Unauthorized Update')`: Rejects if `resource.data.ownerId != request.auth.uid`.
- `test('Blanket Read')`: Rejects if query doesn't include `where('ownerId', '==', uid)`.
