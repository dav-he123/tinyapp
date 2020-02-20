const getUserByEmail = function(email, database) {
  for (const key of Object.keys(database)) {
    if (email === database[key].email) {
      return database[key];
    }
  }
  return false;
};

module.exports = { getUserByEmail };
