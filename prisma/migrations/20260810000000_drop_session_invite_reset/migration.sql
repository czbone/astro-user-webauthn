-- Move Session / DeviceInvite / PasswordReset to Redis
DROP TABLE IF EXISTS "PasswordReset";
DROP TABLE IF EXISTS "DeviceInvite";
DROP TABLE IF EXISTS "Session";
