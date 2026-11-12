const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { DateTime } = require("luxon");
const config = require("../config/config");
const { Token } = require("../models");
const { tokenTypes } = require("../config/tokens");

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: Math.floor(DateTime.utc().toSeconds()),
    exp: Math.floor(expires.toSeconds()),
    type,
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  return Token.create({
    token,
    user: userId,
    expires: expires.toJSDate(),
    type,
    blacklisted,
  });
};

const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  if (payload.type !== type) {
    throw new Error("Invalid token type");
  }
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

const generateAuthTokens = async (user) => {
  const now = DateTime.utc();

  const accessTokenExpires = now.plus({ minutes: config.jwt.accessExpirationMinutes });
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = now.plus({ days: config.jwt.refreshExpirationDays });
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toJSDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toJSDate(),
    },
  };
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
};