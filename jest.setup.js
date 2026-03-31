// Use cost factor of 1 for bcrypt so auth tests don't time out
process.env.BCRYPT_ROUNDS = "1";
