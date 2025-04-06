async function referralHelper(User) {
    let code;
    let exists = true;
    while (exists) {
      // Generate a 6-character alphanumeric code (in uppercase)
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await User.exists({ referralCode: code });
    }
    return code;
  }
  
  module.exports = referralHelper