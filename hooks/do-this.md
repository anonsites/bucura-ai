
## Before enabling OTP later, fix these security issues in USERS_SCHEMA.sql:

Anonymous users can read all verification rows, including plaintext otp_code.
Anonymous users can update any verification row.
OTPs should be accessed only through a protected server/Edge Function, ideally removing the plaintext otp_code column.
The resend function has a likely expired-record handling bug caused by checking FOUND after deleting the record.