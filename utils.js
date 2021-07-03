const getAge = (m) => m && m.unsigned ? m.unsigned.age : 0;

module.exports = {
  getAge,
}
