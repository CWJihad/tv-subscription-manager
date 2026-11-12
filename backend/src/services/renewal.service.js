const Renewal = require("../models/renewal.model");

const createRenewal = async (renewalBody) => {
  const renewal = await Renewal.create({ ...renewalBody });
  return renewal;
};

module.exports = {
  createRenewal,
};
